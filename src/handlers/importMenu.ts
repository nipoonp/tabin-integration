const AWS = require("aws-sdk");
var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

import { EIntegrationType, ITABIN_ITEMS } from "../model/interface";
import { createTabinItems } from "../services/importMenu/createTabinItems";
import { importDoshiiMenu } from "../services/importMenu/doshiiMenu";
import { importWizBangMenu } from "../services/importMenu/wizBangMenu";

export const handler = async (event, context, callback) => {
    console.log("event", event);
    console.log("context", context);

    const input = event.arguments.input;
    const restaurantId = input.restaurantId;

    let integrationType: EIntegrationType = EIntegrationType.SHIFT8;

    const getRestaurantData = async (restaurantId: string) => {
        const queryParams = {
            TableName: process.env.RESTAURANT_TABLE_NAME,
            Limit: 1,
            // IndexName: "byRestaurant",
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeNames: {
                "#id": "id",
            },
            ExpressionAttributeValues: {
                ":id": restaurantId,
            },
        };

        const data = await ddb.query(queryParams).promise();

        if (data.Items.length === 0) throw `No restaurant data found for id, ${restaurantId}`;

        return data.Items[0];
    };

    try {
        const restaurant = await getRestaurantData(restaurantId);

        console.log("xxx...restaurant", restaurant);
        console.log("xxx...restaurant.thirdPartyIntegrations", restaurant.thirdPartyIntegrations);

        if (!restaurant.thirdPartyIntegrations?.enable) throw "Please enable third party integrations";

        let tabinItems: ITABIN_ITEMS | null = null;

        if (restaurant.thirdPartyIntegrations?.shift8?.enable === true) {
            throw "Import menu for Shift8 is unavailable";
        }

        if (restaurant.thirdPartyIntegrations?.wizBang?.enable === true) {
            tabinItems = await importWizBangMenu(restaurant.thirdPartyIntegrations.wizBang);
            integrationType = EIntegrationType.WIZBANG;
        }

        if (restaurant.thirdPartyIntegrations?.doshii?.enable === true) {
            tabinItems = await importDoshiiMenu(restaurant.thirdPartyIntegrations.doshii);
            integrationType = EIntegrationType.DOSHII;
        }

        console.log("xxx...tabinItems", tabinItems);

        if (tabinItems) await createTabinItems(tabinItems, integrationType, restaurant.id, restaurant.restaurantManagerId);

        return callback(null, { restaurantId: restaurantId });
    } catch (e) {
        console.error("xxx...error", e);

        return callback(e.message, null);
    }
};
