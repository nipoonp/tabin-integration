import { EIntegrationType, IGET_RESTAURANT_ORDER_FRAGMENT, IINTEGRATION_MAPPINGS, IThirdPartyIntegrationsShift8 } from "../../model/interface";
import { taxRate, convertCentsToDollarsReturnFloat, calculateTaxAmount } from "../../util/util";
import { SHIFT8_CREATE_ORDER, SHIFT8_ORDER_ITEM, SHIFT8_ORDER_ITEM_MOD } from "../../model/shift8Order";

const axios = require("axios");
const AWS = require("aws-sdk");

const secretManager = new AWS.SecretsManager({ region: process.env.REGION });

const createOrder = async (shift8Credentials: IThirdPartyIntegrationsShift8, accessToken: string, shift8Order) => {
    const url = `${shift8Credentials.storeApiUrl}/ExternalSale?UID=${shift8Credentials.storeUuid}
  &LocationNumber=${shift8Credentials.storeLocationNumber}`;

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
    };

    const result = await axios({
        method: "post",
        url,
        headers,
        data: shift8Order,
    });

    console.log("xxx...result.data", JSON.stringify(result.data));

    return result.data;
};

const getSaleText = (tabinOrder) => {
    let saleText = `Order: ${tabinOrder.number}\n`;

    if (tabinOrder.table) saleText += `Table: ${tabinOrder.table}\n`;
    if (tabinOrder.buzzer) saleText += `Buzzer: ${tabinOrder.buzzer}\n`;
    if (tabinOrder.type) saleText += `${tabinOrder.type}\n`;

    return saleText;
};

const getShift8Items = (integrationMappings: IINTEGRATION_MAPPINGS, tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    let sno = 0;

    const shift8Items: SHIFT8_ORDER_ITEM[] = [];

    tabinOrder.products.forEach((product) => {
        const productTotalRounded = convertCentsToDollarsReturnFloat(product.price);
        const productTotalTax = calculateTaxAmount(product.price);
        const productTotalTaxRounded = convertCentsToDollarsReturnFloat(productTotalTax);
        const productTotalExTaxRounded = convertCentsToDollarsReturnFloat(product.price - productTotalTax);

        const shift8Item: SHIFT8_ORDER_ITEM = {
            ItemID: sno,
            ItemPLU: parseInt(integrationMappings[`${product.id}_${EIntegrationType.SHIFT8}`].externalItemId, 10),
            ItemName: product.name,
            ItemIncTax: productTotalRounded,
            ItemTax: productTotalTaxRounded,
            ItemExTax: productTotalExTaxRounded,
            ItemTaxRate: taxRate,
            ItemNotes: product.notes || "",
            ItemMods: [],
        };

        product.modifierGroups?.forEach((modifierGroup) => {
            modifierGroup.modifiers?.forEach((modifier) => {
                const modifierTotalRounded = convertCentsToDollarsReturnFloat(modifier.price);
                const modifierTotalTax = calculateTaxAmount(modifier.price);
                const modifierTotalTaxRounded = convertCentsToDollarsReturnFloat(modifierTotalTax);
                const modifierTotalExTaxRounded = convertCentsToDollarsReturnFloat(modifier.price - modifierTotalTax);

                const shift8Mod: SHIFT8_ORDER_ITEM_MOD = {
                    ModPLU: parseInt(integrationMappings[`${modifier.id}_${EIntegrationType.SHIFT8}`].externalItemId, 10),
                    ModName: modifier.name,
                    ModIncTax: modifierTotalRounded,
                    ModTax: modifierTotalTaxRounded,
                    ModExTax: modifierTotalExTaxRounded,
                    ModTaxRate: taxRate,
                    ModNotes: "",
                };

                // If quantity is more then 1, add item 'quantity' number of times.
                for (let mIndex = 0; mIndex < modifier.quantity; mIndex += 1) {
                    shift8Item.ItemMods.push(shift8Mod);
                }

                modifier.productModifiers?.forEach((productModifier) => {
                    // Ignore the productModifier object. Add only the productModifierGroupModifier.
                    // We ignore the price for productModifier anyways.
                    productModifier.modifierGroups?.forEach((productModifierGroup) => {
                        productModifierGroup.modifiers?.forEach((productModifierGroupModifier) => {
                            const productModifierGroupModifierTotalRounded = convertCentsToDollarsReturnFloat(productModifierGroupModifier.price);
                            const productModifierGroupModifierTotalTax = calculateTaxAmount(productModifierGroupModifier.price);
                            const productModifierGroupModifierTotalTaxRounded = convertCentsToDollarsReturnFloat(productModifierGroupModifierTotalTax);
                            const productModifierGroupModifierTotExTaxRounded = convertCentsToDollarsReturnFloat(
                                productModifierGroupModifier.price - productModifierGroupModifierTotalTax
                            );

                            const shift8ItemMod: SHIFT8_ORDER_ITEM_MOD = {
                                ModPLU: parseInt(integrationMappings[`${productModifierGroupModifier.id}_${EIntegrationType.SHIFT8}`].externalItemId, 10),
                                ModName: productModifierGroupModifier.name,
                                ModIncTax: productModifierGroupModifierTotalRounded,
                                ModTax: productModifierGroupModifierTotalTaxRounded,
                                ModExTax: productModifierGroupModifierTotExTaxRounded,
                                ModTaxRate: taxRate,
                                ModNotes: "",
                            };

                            // If quantity is more then 1, add item 'quantity' number of times.
                            for (let pmgmIndex = 0; pmgmIndex < productModifierGroupModifier.quantity; pmgmIndex += 1) {
                                shift8Item.ItemMods.push(shift8ItemMod);
                            }
                        });
                    });
                });
            });
        });

        // If quantity is more then 1, add item 'quantity' number of times.
        for (let pIndex = 0; pIndex < product.quantity; pIndex += 1) {
            shift8Items.push(shift8Item);
            sno += 1;
        }
    });

    return shift8Items;
};

const convertShift8Order = (
    shift8Credentials: IThirdPartyIntegrationsShift8,
    integrationMappings: IINTEGRATION_MAPPINGS,
    tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT
) => {
    const tabinOrderTotalRounded = convertCentsToDollarsReturnFloat(tabinOrder.subTotal);
    const tabinOrderTotalTax = calculateTaxAmount(tabinOrder.subTotal);
    const tabinOrderTotalTaxRounded = convertCentsToDollarsReturnFloat(tabinOrderTotalTax);
    const tabinOrderTotalExTaxRounded = convertCentsToDollarsReturnFloat(tabinOrder.subTotal - tabinOrderTotalTax);

    const shift8Sale: SHIFT8_CREATE_ORDER = {
        SaleTotalIncTax: tabinOrderTotalRounded,
        SaleTotalTax: tabinOrderTotalTaxRounded,
        SaleTotalExTax: tabinOrderTotalExTaxRounded,
        SaleDate: tabinOrder.placedAt,
        FulfillmentDate: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        LocationNumber: shift8Credentials.storeLocationNumber,
        ReceiptNumber: Math.round(new Date().getTime() / 1000), // secs since epoch
        SaleText: getSaleText(tabinOrder),
        OrderTypeID: tabinOrder.type === "TAKEAWAY" ? 2 : 1,
        OrderNotes: tabinOrder.notes || "",
        Items: getShift8Items(integrationMappings, tabinOrder),
        PaymentMedia: {
            PaymentTypeNumber: process.env.SHIFT8_PAYMENT_TYPE_NUMBER || "9972",
            PaymentMediaName: process.env.SHIFT8_PAYMENT_MEDIA_NAME || "Kiosk Payment",
            PaymentAmount: tabinOrderTotalRounded,
            PaymentReferenceNumber: tabinOrder.id,
        },
        CustomerDetails: {
            FirstName: tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "Tabin FN",
            LastName: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "Tabin LN",
            Phone: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "TABIN PN",
            Email: tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "TABIN E",
        },
        ResponseURL: `${process.env.SHIFT8_RESPONSE_URL}/${tabinOrder.id}`,
    };

    console.log("xxx...shift8Sale", JSON.stringify(shift8Sale));

    return shift8Sale;
};

export const getShift8AccessToken = async () => {
    const apiConfigSecretId = process.env.SHIFT8_API_CONFIG_SECRET_ID;
    const apiTokenSecretId = process.env.SHIFT8_API_TOKEN_SECRET_ID;

    const getSecrets = async () => {
        const shift8ApiConfig = await secretManager
            .getSecretValue({
                SecretId: apiConfigSecretId,
            })
            .promise();
        const shift8Config = JSON.parse(shift8ApiConfig.SecretString);

        const shift8ApiTokens = await secretManager
            .getSecretValue({
                SecretId: apiTokenSecretId,
            })
            .promise();
        const accessToken = JSON.parse(shift8ApiTokens.SecretString).shift8_access_token;

        console.log("xxx...shift8Config", shift8Config);
        console.log("xxx...shift8ApiTokens", shift8ApiTokens);

        return { shift8Config, accessToken };
    };

    const secrets = await getSecrets();

    return secrets.accessToken;
};

export const createShift8Order = async (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    shift8Credentials: IThirdPartyIntegrationsShift8,
    integrationMappings: IINTEGRATION_MAPPINGS
) => {
    try {
        const accessToken = await getShift8AccessToken();
        const shift8Order = convertShift8Order(shift8Credentials, integrationMappings, order);
        const result = await createOrder(shift8Credentials, accessToken, shift8Order);

        if (!result.isRequestSuccessful) {
            return result.responseMessage;
        }

        return result;
    } catch (e) {
        console.log("Error...", e);
        return e;
    }
};
