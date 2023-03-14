const AWS = require("aws-sdk");
const lambda = new AWS.Lambda({ region: process.env.REGION });
var ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

import { APIGatewayProxyHandler } from "aws-lambda";
import { createDoshiiOrder } from "../services/createOrder/doshiiOrder";
import { createShift8Order } from "../services/createOrder/shift8Order";
import { createWizBangOrder } from "../services/createOrder/wizBangOrder";

export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    console.log("event", event);
    console.log("context", context);

    const newOrder = event.order;
    const thirdPartyIntegrations = event.thirdPartyIntegrations;

    try {
        let result;

        if (thirdPartyIntegrations?.shift8?.active === true) {
            result = await createShift8Order(newOrder);
        }

        if (thirdPartyIntegrations?.wizBang?.active === true) {
            result = await createWizBangOrder(newOrder);
        }

        if (thirdPartyIntegrations?.doshii?.active === true) {
            result = await createDoshiiOrder(newOrder);
        }

        console.log("xxx...result", result);

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
