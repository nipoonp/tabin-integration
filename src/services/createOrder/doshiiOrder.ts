import { IGET_RESTAURANT_ORDER_FRAGMENT, IINTEGRATION_MAPPINGS, EIntegrationType, IThirdPartyIntegrationsDoshii } from "../../model/interface";

import axios from "axios";

import { sign } from "jsonwebtoken";
import {
    EDOSHII_ORDER_STATUS,
    EDOSHII_ORDER_TYPE,
    IDOSHII_CONSUMER,
    IDOSHII_CREATE_ORDER,
    IDOSHII_ORDER,
    IDOSHII_ORDER_ITEM,
    IDOSHII_ORDER_ITEM_OPTION,
    IDOSHII_ORDER_ITEM_OPTION_VARIANT,
    IDOSHII_ORDER_LOG,
    IDOSHII_ORDER_TAX,
    IDOSHII_TRANSACTION,
} from "../../model/doshiiOrder";

import { calculateTaxAmount, taxRate } from "../../util/util";

// let log: IDOSHII_ORDER_LOG = {
//     employeePosRef: "100",
//     employeeName: "Tabin",
//     deviceRef: "Tabin Kiosk",
//     deviceName: "Tabin Kiosk",
//     area: "Tabin Kiosk",
// };

const createOrder = (doshiiCredentials: IThirdPartyIntegrationsDoshii, doshiiOrder: IDOSHII_CREATE_ORDER) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = sign(
                {
                    clientId: doshiiCredentials.clientId,
                    timestamp: new Date(),
                },
                doshiiCredentials.clientSecret
            );

            let headers = {
                Authorization: "Bearer" + " " + token,
                Accept: "application/json",
                "doshii-location-id": doshiiCredentials.locationId,
            };

            const result: any = await axios({
                method: "post",
                url: `${process.env.DOSHII_API_BASE_URL}partner/v3/orders`,
                headers: headers,
                data: doshiiOrder,
            });

            if (result.data) resolve(result.data);
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
};

const convertDoshiiOrder = (tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT, integrationMappings: IINTEGRATION_MAPPINGS) => {
    let order: IDOSHII_ORDER = {
        // checkinId: ""
        externalOrderRef: tabinOrder.id,
        manuallyProcessed: false,
        status: EDOSHII_ORDER_STATUS.pending,
        type: tabinOrder.type == "TAKEAWAY" ? EDOSHII_ORDER_TYPE.pickup : EDOSHII_ORDER_TYPE.dinein,
        // revenueCentre?: "",
        // disablePrinting?: false,
        notes: tabinOrder.notes || "TABIN ORDER",
        requiredAt: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        availableEta: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        items: [],
        surcounts: [],
        taxes: [],
        // log: log,
    };

    let orderTaxes: IDOSHII_ORDER_TAX = {
        // posId: "",
        name: "GST",
        amount: String(taxRate * 100),
        type: "percentage",
        taxType: "inclusive",
        value: Math.round(calculateTaxAmount(tabinOrder.subTotal)),
    };

    order.taxes?.push(orderTaxes);

    tabinOrder.products.forEach((product) => {
        let items: IDOSHII_ORDER_ITEM = {
            posId: integrationMappings[`${product.id}_${EIntegrationType.DOSHII}`].externalItemId,
            name: product.name,
            quantity: product.quantity,
            // description: "",
            unitPrice: product.price.toString(),
            totalBeforeSurcounts: (product.totalPrice * product.quantity).toString(),
            totalAfterSurcounts: (product.totalPrice * product.quantity).toString(),
            tags: [product.category?.name || ""],
            type: "single",
            // includedItems: [],
            surcounts: [],
            taxes: [],
            options: [],
        };

        if (product.modifierGroups) {
            product.modifierGroups.forEach((modifierGroup) => {
                const options: IDOSHII_ORDER_ITEM_OPTION = {
                    posId: integrationMappings[`${modifierGroup.id}_${EIntegrationType.DOSHII}`].externalItemId,
                    name: modifierGroup.name,
                    variants: [],
                };

                if (modifierGroup.modifiers) {
                    modifierGroup.modifiers.forEach((modifier) => {
                        //Modifier choiceDuplicate > 1 is not support in doshii
                        const variants: IDOSHII_ORDER_ITEM_OPTION_VARIANT = {
                            posId: integrationMappings[`${modifier.id}_${EIntegrationType.DOSHII}`].externalItemId,
                            name: modifier.name,
                            price: modifier.price.toString(),
                        };

                        options.variants?.push(variants);
                    });
                }

                items.options?.push(options);
            });
        }

        let itemTaxes: IDOSHII_ORDER_TAX = {
            // posId: "",
            name: "GST",
            amount: String(taxRate * 100),
            type: "percentage",
            taxType: "inclusive",
            value: Math.round(calculateTaxAmount(product.totalPrice * product.quantity)),
        };

        items.taxes?.push(itemTaxes);
        order.items?.push(items);
    });

    // const consumer: IDOSHII_CONSUMER = {
    //     name: tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "Tabin",
    //     email: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "dev@tabin.co.nz",
    //     phone: tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "+642102828894",
    //     address: {
    //         line1: "1824B River Road,",
    //         line2: " Flagstaff",
    //         city: "Hamilton",
    //         state: "Hamilton",
    //         postalCode: "3210",
    //         country: "NZ",
    //         notes: "Tabin Kiosk",
    //     },
    // };

    // const transactions: IDOSHII_TRANSACTION[] = [
    //     {
    //         amount: tabinOrder.payments && tabinOrder.payments.length > 0 ? tabinOrder.payments[0].amount : 0,
    //         reference: "",
    //         invoice: "",
    //         linkedTrxId: "11",
    //         method:
    //             tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.cash > 0
    //                 ? "cash"
    //                 : tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.eftpos > 0
    //                 ? "eftpos"
    //                 : "other",
    //         tip: 0,
    //         prepaid: true,
    //         surcounts: [],
    //     },
    // ];

    const doshiiOrder: IDOSHII_CREATE_ORDER = {
        order: order,
        // consumer: consumer,
        // transactions: transactions,
        // members: [],
    };

    return doshiiOrder;
};

const createDoshiiOrder = async (
    order: IGET_RESTAURANT_ORDER_FRAGMENT,
    doshiiCredentials: IThirdPartyIntegrationsDoshii,
    integrationMappings: IINTEGRATION_MAPPINGS
) => {
    const doshiiOrder = convertDoshiiOrder(order, integrationMappings);

    console.log("xxx...doshiiOrder", JSON.stringify(doshiiOrder));

    const result = await createOrder(doshiiCredentials, doshiiOrder);

    return result;
};

export { createDoshiiOrder };
