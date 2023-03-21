import { IGET_RESTAURANT_ORDER_FRAGMENT } from "../Model/Interface";
import { createDoshiiOrder } from "../services/createOrder/doshiiOrder";
import { createShift8Order } from "../services/createOrder/shift8Order";
import { createWizBangOrder } from "../services/createOrder/wizBangOrder";

export const handler = async (event, context, callback) => {
    console.log("event", event);
    console.log("context", context);

    const newOrder: IGET_RESTAURANT_ORDER_FRAGMENT = event.order;
    const thirdPartyIntegrations = event.thirdPartyIntegrations;

    try {
        let result;

        if (thirdPartyIntegrations?.shift8?.enable === true) {
            result = await createShift8Order(thirdPartyIntegrations.shift8, newOrder);
        }

        if (thirdPartyIntegrations?.wizBang?.enable === true) {
            result = await createWizBangOrder(thirdPartyIntegrations.wizBang, newOrder);
        }

        if (thirdPartyIntegrations?.doshii?.enable === true) {
            result = await createDoshiiOrder(thirdPartyIntegrations.doshii, newOrder);
        }

        console.log("xxx...result", result);

        return callback(null, { orderId: newOrder.id });
    } catch (e) {
        console.error("xxx...error", e);

        return callback(e.message, null);
    }
};
