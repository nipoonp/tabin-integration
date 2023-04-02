import { IGET_RESTAURANT_ORDER_FRAGMENT, IINTEGRATION_MAPPINGS } from "../model/interface";
import { createDoshiiOrder } from "../services/createOrder/doshiiOrder";
import { createShift8Order } from "../services/createOrder/shift8Order";
import { createWizBangOrder } from "../services/createOrder/wizBangOrder";

const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

export const handler = async (event, context, callback) => {
    console.log("event", event);
    console.log("context", context);

    const newOrder: IGET_RESTAURANT_ORDER_FRAGMENT = event.order;
    const { thirdPartyIntegrations } = event;

    const getIntegrationMappingData = async (restaurantId: string) => {
        const queryParams = {
            TableName: process.env.INTEGRATION_MAPPING_TABLE_NAME,
            Limit: 1000000,
            IndexName: "byRestaurantIdByIntegrationType",
            KeyConditionExpression: "#integrationMappingRestaurantId = :integrationMappingRestaurantId",
            ExpressionAttributeNames: {
                "#integrationMappingRestaurantId": "integrationMappingRestaurantId",
            },
            ExpressionAttributeValues: {
                ":integrationMappingRestaurantId": restaurantId,
            },
        };

        const data = await ddb.query(queryParams).promise();

        if (data.Items.length === 0) throw `No integration mapping data found for id, ${restaurantId}`;

        const mappings: IINTEGRATION_MAPPINGS = {};

        data.Items.forEach((mapping) => {
            mappings[mapping.id] = mapping;
        });

        return mappings;
    };

    try {
        const integrationMappings: IINTEGRATION_MAPPINGS = await getIntegrationMappingData(newOrder.orderRestaurantId);

        console.log("xxx...integrationMappings", integrationMappings);

        let result;

        if (thirdPartyIntegrations?.shift8?.enable === true) {
            result = await createShift8Order(newOrder, thirdPartyIntegrations.shift8, integrationMappings);
        }

        if (thirdPartyIntegrations?.wizBang?.enable === true) {
            result = await createWizBangOrder(newOrder, thirdPartyIntegrations.wizBang, integrationMappings);
        }

        if (thirdPartyIntegrations?.doshii?.enable === true) {
            result = await createDoshiiOrder(newOrder, thirdPartyIntegrations.doshii, integrationMappings);
        }

        console.log("xxx...result", JSON.stringify(result));

        return callback(null, { orderId: newOrder.id });
    } catch (e) {
        console.error("xxx...error", e);

        return callback(e.message, null);
    }
};
