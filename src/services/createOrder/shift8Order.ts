import { EIntegrationType, IGET_RESTAURANT_ORDER_FRAGMENT, IINTEGRATION_MAPPINGS, IThirdPartyIntegrationsShift8 } from "../../model/interface";

const axios = require("axios");
const AWS = require("aws-sdk");
const secretManager = new AWS.SecretsManager({ region: process.env.REGION });

AWS.config.update({ region: process.env.REGION });

var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

interface IShift8Item {
    ItemID: number;
    ItemPLU: number;
    ItemName: string;
    ItemIncTax: number;
    ItemTax: number;
    ItemExTax: number;
    ItemTaxRate: number;
    ItemNotes: string;
    ItemMods: IShift8Mod[];
}

interface IShift8Mod {
    ModPLU: number;
    ModName: string;
    ModIncTax: number;
    ModTax: number;
    ModExTax: number;
    ModTaxRate: number;
    ModNotes: string;
}

const taxRate = 0.15;

const convertCentsToDollarsReturnFloat = (price) => parseFloat((price / 100).toFixed(2));

const calculateTaxAmount = (total) => {
    const diff = total / (1 + taxRate);
    return total - diff;
};

const createOrder = async (shift8Credentials: IThirdPartyIntegrationsShift8, accessToken: string, shift8Order) => {
    const url = `${shift8Credentials.storeApiUrl}/ExternalSale?UID=${shift8Credentials.storeUuid}&LocationNumber=${shift8Credentials.storeLocationNumber}`;

    console.log("xxx...url", url);

    const headers = {
        Authorization: "Bearer" + " " + accessToken,
        Accept: "application/json",
    };

    const result = await axios({
        method: "post",
        url: url,
        headers: headers,
        data: shift8Order,
    });

    console.log("xxx...result.data", result.data);

    return result.data;
};

const convertShift8Order = (shift8Credentials: IThirdPartyIntegrationsShift8, mappingData, tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const getSaleText = (tabinOrder) => {
        let saleText = `Order: ${tabinOrder.number}\n`;

        if (tabinOrder.table) saleText += `Table: ${tabinOrder.table}\n`;
        if (tabinOrder.buzzer) saleText += `Buzzer: ${tabinOrder.buzzer}\n`;
        if (tabinOrder.type) saleText += `${tabinOrder.type}\n`;

        return saleText;
    };

    const getShift8Items = (mappingData, tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
        let sno = 0;

        const shift8Items: IShift8Item[] = [];

        tabinOrder.products.forEach((product) => {
            const productTotalRounded = convertCentsToDollarsReturnFloat(product.price);
            const productTotalTax = calculateTaxAmount(product.price);
            const productTotalTaxRounded = convertCentsToDollarsReturnFloat(productTotalTax);
            const productTotalExTaxRounded = convertCentsToDollarsReturnFloat(product.price - productTotalTax);

            let shift8Item: IShift8Item = {
                ItemID: sno,
                ItemPLU: parseInt(mappingData[product.id]),
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

                    const shift8Mod: IShift8Mod = {
                        ModPLU: parseInt(mappingData[modifier.id]),
                        ModName: modifier.name,
                        ModIncTax: modifierTotalRounded,
                        ModTax: modifierTotalTaxRounded,
                        ModExTax: modifierTotalExTaxRounded,
                        ModTaxRate: taxRate,
                        ModNotes: "",
                    };

                    //If quantity is more then 1, add item 'quantity' number of times.
                    for (var mIndex = 0; mIndex < modifier.quantity; mIndex++) {
                        shift8Item.ItemMods.push(shift8Mod);
                    }

                    modifier.productModifiers?.forEach((productModifier) => {
                        //Ignore the productModifier object. Add only the productModifierGroupModifier. We ignore the price for productModifier anyways.
                        productModifier.modifierGroups?.forEach((productModifierGroup) => {
                            productModifierGroup.modifiers?.forEach((productModifierGroupModifier) => {
                                const productModifierGroupModifierTotalRounded = convertCentsToDollarsReturnFloat(productModifierGroupModifier.price);
                                const productModifierGroupModifierTotalTax = calculateTaxAmount(productModifierGroupModifier.price);
                                const productModifierGroupModifierTotalTaxRounded =
                                    convertCentsToDollarsReturnFloat(productModifierGroupModifierTotalTax);
                                const productModifierGroupModifierTotalExTaxRounded = convertCentsToDollarsReturnFloat(
                                    productModifierGroupModifier.price - productModifierGroupModifierTotalTax
                                );

                                const shift8ItemMod: IShift8Mod = {
                                    ModPLU: parseInt(mappingData[productModifierGroupModifier.id]),
                                    ModName: productModifierGroupModifier.name,
                                    ModIncTax: productModifierGroupModifierTotalRounded,
                                    ModTax: productModifierGroupModifierTotalTaxRounded,
                                    ModExTax: productModifierGroupModifierTotalExTaxRounded,
                                    ModTaxRate: taxRate,
                                    ModNotes: "",
                                };

                                //If quantity is more then 1, add item 'quantity' number of times.
                                for (var pmgmIndex = 0; pmgmIndex < productModifierGroupModifier.quantity; pmgmIndex++) {
                                    shift8Item.ItemMods.push(shift8ItemMod);
                                }
                            });
                        });
                    });
                });
            });

            //If quantity is more then 1, add item 'quantity' number of times.
            for (var pIndex = 0; pIndex < product.quantity; pIndex++) {
                shift8Items.push(shift8Item);
                sno = sno + 1;
            }
        });

        return shift8Items;
    };

    const tabinOrderTotalRounded = convertCentsToDollarsReturnFloat(tabinOrder.subTotal);
    const tabinOrderTotalTax = calculateTaxAmount(tabinOrder.subTotal);
    const tabinOrderTotalTaxRounded = convertCentsToDollarsReturnFloat(tabinOrderTotalTax);
    const tabinOrderTotalExTaxRounded = convertCentsToDollarsReturnFloat(tabinOrder.subTotal - tabinOrderTotalTax);

    const shift8Sale = {
        SaleTotalIncTax: tabinOrderTotalRounded,
        SaleTotalTax: tabinOrderTotalTaxRounded,
        SaleTotalExTax: tabinOrderTotalExTaxRounded,
        SaleDate: tabinOrder.placedAt,
        FulfillmentDate: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        LocationNumber: shift8Credentials.storeLocationNumber,
        ReceiptNumber: Math.round(new Date().getTime() / 1000), //secs since epoch
        SaleText: getSaleText(tabinOrder),
        OrderTypeID: tabinOrder.type == "TAKEAWAY" ? 2 : 1,
        OrderNotes: tabinOrder.notes || "",
        Items: getShift8Items(mappingData, tabinOrder),
        PaymentMedia: {
            PaymentTypeNumber: process.env.SHIFT8_PAYMENT_TYPE_NUMBER,
            PaymentMediaName: process.env.SHIFT8_PAYMENT_MEDIA_NAME,
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

const createShift8Order = async (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    shift8Credentials: IThirdPartyIntegrationsShift8,
    integrationMappings: IINTEGRATION_MAPPINGS
) => {
    const apiConfigSecretId = process.env.SHIFT8_API_CONFIG_SECRET_ID;
    const apiTokenSecretId = process.env.SHIFT8_API_TOKEN_SECRET_ID;

    console.log("xxx...event", event);

    const getSecrets = async () => {
        const shift8ApiConfig = await secretManager.getSecretValue({ SecretId: apiConfigSecretId }).promise();
        const shift8Config = JSON.parse(shift8ApiConfig.SecretString);

        const shift8ApiTokens = await secretManager.getSecretValue({ SecretId: apiTokenSecretId }).promise();
        const accessToken = JSON.parse(shift8ApiTokens.SecretString).shift8_access_token;

        console.log("xxx...shift8Config", shift8Config);
        console.log("xxx...shift8ApiTokens", shift8ApiTokens);

        return { shift8Config, accessToken };
    };

    const getIntegrationMappingData = async (restaurantId: string) => {
        const queryParams = {
            TableName: process.env.INTEGRATION_MAPPING_TABLE_NAME,
            Limit: 10000,
            IndexName: "byRestaurant",
            KeyConditionExpression: "#integrationMappingRestaurantId = :integrationMappingRestaurantId and #integrationType = :integrationType",
            ExpressionAttributeNames: {
                "#integrationMappingRestaurantId": "integrationMappingRestaurantId",
                "#integrationType": "integrationType",
            },
            ExpressionAttributeValues: {
                ":integrationMappingRestaurantId": restaurantId,
                ":integrationType": "SHIFT8",
            },
        };

        const data = await ddb.query(queryParams).promise();

        if (data.Items.length == 0) throw `No mapping data found for id, ${restaurantId}`;

        const mappingData = {};

        data.Items.forEach((item) => {
            mappingData[item.itemId] = item.externalItemId;
        });

        return mappingData;
    };

    const secrets = await getSecrets();
    const mappingData = await getIntegrationMappingData(order.orderRestaurantId);

    const shift8Order = convertShift8Order(shift8Credentials, mappingData, order);
    const result = await createOrder(shift8Credentials, secrets.accessToken, shift8Order);

    if (!result.isRequestSuccessful) {
        return result.responseMessage;
    }
};

export { createShift8Order };
