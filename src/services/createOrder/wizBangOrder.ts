import axios from 'axios';
import {
  EIntegrationType,
  IGET_RESTAURANT_ORDER_FRAGMENT,
  IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT,
  IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT,
  IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT,
  IINTEGRATION_MAPPINGS,
  IThirdPartyIntegrationsWizBang,
} from '../../model/interface';
import {
  IORDER_LINE_MODIFIERS,
  IWIZBANG_ORDER,
  IWIZBANG_ORDER_CUSTOMER,
  IWIZBANG_ORDER_ORDER_LINES,
  IWIZBANG_ORDER_TENDER,
} from '../../model/wizBangOrder';

import { convertCentsToDollarsReturnFloat } from '../../util/util';

const customer: IWIZBANG_ORDER_CUSTOMER = {
  CUSTOMERID: 1,
  NAME: '',
  SURNAME: '',
  FIRSTNAME: '',
  MIDDLENAME: '',
  TITLE: '',
  PHONENO: '',
  EMAIL: '',
  ADDRESS: {
    LINE1: '',
    LINE2: '',
    LINE3: '',
    LINE4: '',
    LINE5: '',
  },
  LOCATION: '',
  NOTES: '',
};

const wizBangOrder: IWIZBANG_ORDER = {
  TABLENAME: '',
  LINKCODE: '',
  ACCOUNTID: null,
  EATINPICKUPDELIVERY: 2,
  CUSTOMER: customer,
  ORDERLINES: [],
  TENDER: [],
};

const createOrder = async (
  wizBangCredentials: IThirdPartyIntegrationsWizBang,
  data: IWIZBANG_ORDER,
) => {
  const requestedData = JSON.stringify(data);
  const { username } = wizBangCredentials;
  const { password } = wizBangCredentials;
  const encodedBase64Token = Buffer.from(`${username}:${password}`).toString('base64');
  let authorization = `Basic ${encodedBase64Token}`;

  authorization = authorization.replace(/[\r\n]+/gm, '');

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: authorization,
  };

  const result = await axios({
    method: 'post',
    url: `${wizBangCredentials.storeApiUrl}wizbang/restapi/service/order`,
    headers,
    data: requestedData,
  });

  console.log('xxx...result.data', JSON.stringify(result.data));

  return result.data;
};

const convertWizBangOrder = (
  tabinOrder: IGET_RESTAURANT_ORDER_FRAGMENT,
  integrationMappings: IINTEGRATION_MAPPINGS,
) => {
  wizBangOrder.TABLENAME = tabinOrder.table ? tabinOrder.table : '';
  wizBangOrder.ACCOUNTID = 1;
  if (tabinOrder.type === 'DINEIN') {
    wizBangOrder.EATINPICKUPDELIVERY = 1;
  } else if (tabinOrder.type === 'TAKEAWAY') {
    wizBangOrder.EATINPICKUPDELIVERY = 2;
  } else {
    wizBangOrder.EATINPICKUPDELIVERY = 3;
  }

  wizBangOrder.CUSTOMER.FIRSTNAME = tabinOrder.customerInformation?.firstName
    ? tabinOrder.customerInformation.firstName : '';
  wizBangOrder.CUSTOMER.EMAIL = tabinOrder.customerInformation?.email
    ? tabinOrder.customerInformation.email : '';
  wizBangOrder.CUSTOMER.PHONENO = tabinOrder.customerInformation?.phoneNumber
    ? tabinOrder.customerInformation.phoneNumber : '';

  tabinOrder.products.forEach(
    (product: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT) => {
      const orderlines: IWIZBANG_ORDER_ORDER_LINES = {
        ITEMID: parseInt(integrationMappings[
          `${product.id}_${EIntegrationType.WIZBANG}`
        ].externalItemId, 10),
        QTY: product.quantity ? product.quantity : null,
        USEUNITPRICE: true,
        ITEMABBREV: product.name,
        UNITPRICE: convertCentsToDollarsReturnFloat(product.price),
        SALESTAXPERCENT: 15,
        ORDERLINEMODIFIERS: [],
      };

      product.modifierGroups?.forEach(
        (modifierGroup: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT) => {
          modifierGroup.modifiers?.forEach(
            (modifier: IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT) => {
              const modifiers: IORDER_LINE_MODIFIERS = {
                MODIFIER: modifier.name,
                USEMODPRICE: true,
                MODPRICE: convertCentsToDollarsReturnFloat(modifier.price),
              };

              orderlines.ORDERLINEMODIFIERS.push(modifiers);
            },
          );
        },
      );

      wizBangOrder.ORDERLINES.push(orderlines);
    },
  );

  tabinOrder.payments?.forEach((payment) => {
    const tender: IWIZBANG_ORDER_TENDER = {
      TENDERTYPEID: payment.type === 'CASH' ? 4 : 1,
      PAYMENT: convertCentsToDollarsReturnFloat(payment.amount),
      TIP: 0,
    };

    wizBangOrder.TENDER.push(tender);
  });

  console.log('xxx...wizBangOrder', JSON.stringify(wizBangOrder));

  return wizBangOrder;
};

export const createWizBangOrder = async (
  order: IGET_RESTAURANT_ORDER_FRAGMENT,
  wizBangCredentials: IThirdPartyIntegrationsWizBang,
  integrationMappings: IINTEGRATION_MAPPINGS,
) => {
  try {
    const wizBangOrders = convertWizBangOrder(order, integrationMappings);
    const result = await createOrder(wizBangCredentials, wizBangOrders);

    return result;
  } catch (e) {
    return e;
  }
};
