import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../../Model/Interface";

const axios = require("axios");
const AWS = require("aws-sdk");
const secretManager = new AWS.SecretsManager({ region: process.env.REGION });

AWS.config.update({ region: process.env.REGION });

var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const taxRate = 0.15;

const convertCentsToDollarsReturnFloat = (price) => parseFloat((price / 100).toFixed(2));

const calculateTaxAmount = (total) => {
    const diff = total / (1 + taxRate);
    return total - diff;
};

const createOrder = async (order) => {
    const url = `${shift8StoreApiUrl}/ExternalSale?UID=${shift8StoreUuid}&LocationNumber=${shift8StoreLocationNumber}&LocationName=${"Sylvia Park"}`;

    console.log("xxx...url", url);

    const headers = {
        Authorization: "Bearer" + " " + accessToken,
        Accept: "application/json",
    };

    const result = await axios({
        method: "post",
        url: url,
        headers: headers,
        data: order,
    });

    console.log("xxx...result.data", result.data);

    return result.data;
};

const convertShift8Order = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const getSaleText = (tabinOrder) => {
        let saleText = `Order: ${tabinOrder.number}\n`;

        if (tabinOrder.table) saleText += `Table: ${tabinOrder.table}\n`;
        if (tabinOrder.buzzer) saleText += `Buzzer: ${tabinOrder.buzzer}\n`;
        if (tabinOrder.type) saleText += `${tabinOrder.type}\n`;

        return saleText;
    };

    const getShift8Items = (mappingData, tabinOrder) => {
        let sno = 0;

        const shift8Items = [];

        tabinOrder.products.forEach((product) => {
            const productTotalRounded = convertCentsToDollarsReturnFloat(product.price);
            const productTotalTax = calculateTaxAmount(product.price);
            const productTotalTaxRounded = convertCentsToDollarsReturnFloat(productTotalTax);
            const productTotalExTaxRounded = convertCentsToDollarsReturnFloat(product.price - productTotalTax);

            let shift8Item = {
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

                    let shift8Mod = {
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

                                let shift8ItemMod = {
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
        LocationNumber: shift8StoreLocationNumber,
        ReceiptNumber: Math.round(new Date().getTime() / 1000), //secs since epoch
        SaleText: getSaleText(tabinOrder),
        OrderTypeID: tabinOrder.type == "TAKEAWAY" ? 2 : 1,
        OrderNotes: tabinOrder.notes || "",
        Items: getShift8Items(mappingData, tabinOrder),
        PaymentMedia: {
            PaymentTypeNumber: shift8Config.payment_type_number,
            PaymentMediaName: shift8Config.payment_media_name,
            PaymentAmount: tabinOrderTotalRounded,
            PaymentReferenceNumber: tabinOrder.id,
        },
        CustomerDetails: {
            FirstName: tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "Tabin FN",
            LastName: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "Tabin LN",
            Phone: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "TABIN PN",
            Email: tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "TABIN E",
        },
        ResponseURL: `${shift8Config.response_url}/${tabinOrder.id}`,
    };

    console.log("xxx...shift8Sale", JSON.stringify(shift8Sale));

    return shift8Sale;
};

const createShift8Order = async (order: IGET_RESTAURANT_ORDER_FRAGMENT) => {
    const apiConfigSecretId = "prod/shift8/api_config";
    const apiTokenSecretId = "prod/shift8/api_token";

    console.log("xxx...event", event);

    const shift8StoreApiUrl = event.shift8StoreApiUrl;
    const shift8StoreUuid = event.shift8StoreUuid;
    const shift8StoreLocationNumber = event.shift8StoreLocationNumber;
    const newOrder = event.order;

    let shift8Config = {};
    let accessToken = "";

    const getSecrets = async () => {
        const shift8ApiConfig = await secretManager.getSecretValue({ SecretId: apiConfigSecretId }).promise();
        shift8Config = JSON.parse(shift8ApiConfig.SecretString);

        const shift8ApiTokens = await secretManager.getSecretValue({ SecretId: apiTokenSecretId }).promise();
        accessToken = JSON.parse(shift8ApiTokens.SecretString).shift8_access_token;

        console.log("xxx...shift8Config", shift8Config);
        console.log("xxx...shift8ApiTokens", shift8ApiTokens);
    };

    const getIntegrationMappingData = async (restaurantId) => {
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

        if (data.Items.length == 0) {
            throw `No mapping data found for id, ${restaurantId}`;
        }

        const mappingData = {};

        data.Items.forEach((item) => {
            mappingData[item.itemId] = item.externalItemId;
        });

        return mappingData;
    };

    await getSecrets();
    const mappingData = await getIntegrationMappingData(newOrder.orderRestaurantId);

    const convertedData = convertShift8Order(order);
    const result = await createOrder(convertedData);

    if (!result.isRequestSuccessful) {
        return result.responseMessage;
    }
};

export { createShift8Order };
