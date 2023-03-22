import {
    IGET_RESTAURANT_ORDER_FRAGMENT,
    IDOSHII_ORDER_FINAL_DATA,
    IDOSHII_ORDER,
    IDOSHII_ITEMS,
    IDOSHII_ITEMS_OPTIONS,
    IDOSHII_ITEMS_OPTIONS_VARIANTS,
    IDOSHII_ITEMS_TAXES,
    IDOSHII_LOG,
    IDOSHII_TRANSACTIONS,
    IINTEGRATION_MAPPINGS,
    EIntegrationType,
    IThirdPartyIntegrationsDoshii,
    IDOSHII_CONSUMER,
} from "../../model/interface";

import axios from "axios";

import { sign } from "jsonwebtoken";

let log: IDOSHII_LOG = {
    employeePosRef: "100",
    employeeName: "Tabin",
    deviceRef: "Tabin Kiosk",
    deviceName: "Tabin Kiosk",
    area: "Tabin Kiosk",
};

const createOrder = (doshiiCredentials: IThirdPartyIntegrationsDoshii, convertedData: IDOSHII_ORDER_FINAL_DATA) => {
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
                data: convertedData,
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
        externalOrderRef: tabinOrder.id,
        manuallyProcessed: false,
        status: "pending",
        type: tabinOrder.type == "TAKEAWAY" ? "pickup" : "dinein",
        notes: tabinOrder.notes || "TABIN ORDER",
        requiredAt: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        availableEta: tabinOrder.orderScheduledAt ? tabinOrder.orderScheduledAt : tabinOrder.placedAt,
        items: [],
        surcounts: [],
        taxes: [],
        log: log,
    };

    tabinOrder.products.forEach((product) => {
        let items: IDOSHII_ITEMS = {
            posId: integrationMappings[`${product.id}_${EIntegrationType.DOSHII}`].externalItemId,
            name: product.name,
            quantity: product.quantity,
            description: product.name,
            unitPrice: product.price.toString(),
            totalBeforeSurcounts: (product.totalPrice * product.quantity).toString(),
            totalAfterSurcounts: (product.totalPrice * product.quantity).toString(),
            tags: [],
            type: "single",
            // includedItems: [],
            surcounts: [],
            taxes: [],
            options: [],
        };

        let orderTaxes: IDOSHII_ITEMS_TAXES = {
            posId: product.id,
            name: product.name,
            amount: "15",
            type: "percentage",
            taxType: "inclusive",
            value: (product.price * product.quantity).toString(),
        };

        if (product.category?.name) {
            const categoryName = product.category?.name;

            items.tags.push(categoryName);
        }

        if (product.modifierGroups) {
            product.modifierGroups.forEach((modifierGroup) => {
                const options: IDOSHII_ITEMS_OPTIONS = {
                    posId: integrationMappings[`${modifierGroup.id}_${EIntegrationType.DOSHII}`].externalItemId,
                    name: modifierGroup.name,
                    variants: [],
                };

                if (modifierGroup.modifiers) {
                    modifierGroup.modifiers.forEach((modifier) => {
                        //Modifier choiceDuplicate > 1 is not support in doshii
                        const variants: IDOSHII_ITEMS_OPTIONS_VARIANTS = {
                            posId: integrationMappings[`${modifier.id}_${EIntegrationType.DOSHII}`].externalItemId,
                            name: modifier.name,
                            price: modifier.price.toString(),
                        };

                        options.variants.push(variants);
                    });
                }

                items.options.push(options);
            });
        }
        let itemTaxes: IDOSHII_ITEMS_TAXES = {
            posId: items.posId,
            name: items.name,
            amount: "15",
            type: "percentage",
            taxType: "inclusive",
            value: items.unitPrice,
        };

        items.taxes.push(itemTaxes);
        order.items.push(items);
        order.taxes.push(orderTaxes);
    });

    const consumer: IDOSHII_CONSUMER = {
        name: tabinOrder.customerInformation?.firstName ? tabinOrder.customerInformation.firstName : "Tabin",
        email: tabinOrder.customerInformation?.email ? tabinOrder.customerInformation.email : "dev@tabin.co.nz",
        phone: tabinOrder.customerInformation?.phoneNumber ? tabinOrder.customerInformation.phoneNumber : "+642102828894",
        address: {
            line1: "1824B River Road,",
            line2: " Flagstaff",
            city: "Hamilton",
            state: "Hamilton",
            postalCode: "3210",
            country: "NZ",
            notes: "Tabin Kiosk",
        },
    };

    const transactions: IDOSHII_TRANSACTIONS[] = [
        {
            amount: tabinOrder.payments && tabinOrder.payments.length > 0 ? tabinOrder.payments[0].amount : 0,
            reference: "",
            invoice: "",
            linkedTrxId: "11",
            method:
                tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.cash > 0
                    ? "cash"
                    : tabinOrder.paymentAmounts && tabinOrder.paymentAmounts.eftpos > 0
                    ? "eftpos"
                    : "other",
            tip: 0,
            prepaid: true,
            surcounts: [],
        },
    ];

    const convertedData: IDOSHII_ORDER_FINAL_DATA = {
        order: order,
        consumer: consumer,
        transactions: transactions,
        members: [],
    };

    return convertedData;
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
