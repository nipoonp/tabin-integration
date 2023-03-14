const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({ region: process.env.REGION });
var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

import { APIGatewayProxyHandler } from "aws-lambda";
import { ITABIN_ITEMS } from "../model/interface";
import { createTabinItems } from "../services/importMenu/createTabinItems";
import { convertDoshiiMenu } from "../services/importMenu/doshiiMenu";
import { convertWizBangMenu } from "../services/importMenu/wizBangMenu";

export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    console.log("event", event);
    console.log("context", context);

    const input = event.arguments.input;
    const restaurantId = input.restaurantId;

    const getRestaurantData = async (restaurantId) => {
        const queryParams = {
            TableName: process.env.RESTAURANT_TABLE_NAME,
            Limit: 1,
            // IndexName: "byRestaurant",
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeNames: {},
            "#id": "id",

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

        let tabinItems: ITABIN_ITEMS | null = null;

        if (restaurant.thirdPartyIntegrations?.shift8?.active === true) {
            throw "Import menu for Shift8 is unavailable";
        }

        if (restaurant.thirdPartyIntegrations?.wizBang?.active === true) {
            tabinItems = await convertWizBangMenu();
        }

        if (restaurant.thirdPartyIntegrations?.doshii?.active === true) {
            tabinItems = await convertDoshiiMenu();
        }

        if (tabinItems) await createTabinItems(tabinItems);

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: "sucess!",
            }),
        };
    } catch (err) {
        // Error handling
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "some error happened",
            }),
        };
    }
};
