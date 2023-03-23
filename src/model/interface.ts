export interface IOrderPaymentAmounts {
    cash: number;
    eftpos: number;
    online: number;
    uberEats: number;
    menulog: number;
}

export interface IS3Object {
    key: string;
    bucket: string;
    region: string;
    identityPoolId: string;
}

export interface IPayment {
    type: string;
    amount: number;
}

export interface IGET_RESTAURANT_ORDER_FRAGMENT {
    id: string;
    placedAt: string;
    placedAtUtc: string | null;
    parkedAt?: string | null;
    updatedAt?: string | null;
    completedAt?: string | null;
    completedAtUtc?: string | null;
    createdAt?: string | null;
    cancelledAtUtc?: string | null;
    cancelledAt?: string | null;
    refundedAt?: string | null;
    notes?: string | null;
    eftposReceipt?: string | null;
    total: number;
    discount?: number | null;
    promotionId?: string | null;
    subTotal: number;
    paid: boolean;
    paymentAmounts?: IOrderPaymentAmounts | null;
    payments?: IPayment[];
    stripePaymentId?: string | null;
    onlineOrder?: boolean | null;
    guestCheckout?: boolean | null;
    orderScheduledAt?: string | null;
    customerInformation?: {
        firstName?: string | null;
        email?: string | null;
        phoneNumber?: string | null;
    } | null;
    status: "NEW" | "COMPLETED" | "CANCELLED" | "PARKED" | "REFUNDED";
    "status#placedAt": string;
    type: "DINEIN" | "TAKEAWAY" | "DELIVERY";
    number: string;
    orderRestaurantId: string;
    orderUserId: string;
    owner?: string;
    table?: string | null;
    buzzer?: string | null;
    registerId?: string;
    products: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[];
    __typename: string;
}

export interface IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT {
    id: string;
    name: string;
    price: number;
    totalPrice: number;
    discount?: number;
    quantity: number;
    notes?: string | null;
    image?: IS3Object | null;
    category: IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT | null;
    modifierGroups?: IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT[] | null;
}

export interface IGET_RESTAURANT_ORDER_CATEGORY_FRAGMENT {
    id: string;
    name: string;
    image?: IS3Object | null;
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_GROUP_FRAGMENT {
    id: string;
    name: string;
    choiceDuplicate: number;
    choiceMin: number;
    choiceMax: number;
    collapsedByDefault?: boolean;
    hideForCustomer?: boolean | null;
    modifiers?: IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT[];
}

export interface IGET_RESTAURANT_ORDER_MODIFIER_FRAGMENT {
    id: string;
    name: string;
    price: number;
    preSelectedQuantity?: number | null;
    quantity: number;
    productModifiers?: IGET_RESTAURANT_ORDER_PRODUCT_FRAGMENT[] | null;
    image?: IS3Object | null;
}

//WIZBANG ORDER INTERFACES
export interface IWIZBANG_ORDER_CUSTOMER {
    CUSTOMERID: number | null;
    NAME: string;
    SURNAME: string;
    FIRSTNAME: string;
    MIDDLENAME: string;
    TITLE: string;
    PHONENO: string;
    EMAIL: string;
    ADDRESS: {
        LINE1: string;
        LINE2: string;
        LINE3: string;
        LINE4: string;
        LINE5: string;
    };
    LOCATION: string;
    NOTES: string;
}

export interface IWIZBANG_ORDER_ORDERLINES {
    ITEMID: number | null;
    QTY: number | null;
    USEUNITPRICE: boolean;
    ITEMABBREV: string;
    UNITPRICE: number | null;
    SALESTAXPERCENT: number | null;
    ORDERLINEMODIFIERS: Array<IORDERLINE_MODIFIERS>;
}

export interface IORDERLINE_MODIFIERS {
    MODIFIER: string;
    USEMODPRICE: boolean;
    MODPRICE: number | null;
}

export interface IWIZBANG_ORDER_TENDER {
    TENDERTYPEID: number;
    PAYMENT: number;
    TIP: number;
}

export interface IWIZBANG_ORDER {
    TABLENAME: string;
    LINKCODE: string;
    ACCOUNTID: number | null;
    EATINPICKUPDELIVERY: number;
    CUSTOMER: IWIZBANG_ORDER_CUSTOMER;
    ORDERLINES: Array<IWIZBANG_ORDER_ORDERLINES>;
    TENDER: Array<IWIZBANG_ORDER_TENDER>;
}

export interface ITABIN_ITEMS {
    categories: ICategory[];
    products: IProduct[];
    categoryProductLinks: ICategoryProductLink[];
    modifierGroups: IModifierGroup[];
    productModifierGroupLinks: IProductModifierGroupLink[];
    modifierGroupModifierLinks: IModifierGroupModifierLink[];
    modifiers: IModifier[];
}

export interface ICategory {
    categoryId: string;
    name: string;
    kitchenName?: string;
    description?: string;
    displaySequence: number;
}

export interface ICategoryProductLink {
    categoryId: string;
    productId: string;
    displaySequence: number;
}

export interface IProduct {
    productId: string;
    name: string;
    description?: string;
    kitchenName?: string;
    tags?: string;
    price: number;
    skuCode?: string;
    totalQuantityAvailable?: number;
    soldOut?: boolean;
}

export interface IProductModifierGroupLink {
    productId: string;
    modifierGroupId: string;
    displaySequence: number;
}

export interface IModifierGroup {
    modifierGroupId: string;
    name: string;
    kitchenName?: string;
    choiceDuplicate: number;
    choiceMin: number;
    choiceMax: number;
}

export interface IModifierGroupModifierLink {
    modifierGroupId: string;
    modifierId: string;
    displaySequence: number;
    preSelectedQuantity?: number;
}

export interface IModifier {
    modifierId: string;
    name: string;
    kitchenName?: string;
    price: number;
    modifierProductModifierId?: string;
}

export interface IThirdPartyIntegrations {
    enable: boolean | null;
    shift8: IThirdPartyIntegrationsShift8 | null;
    wizBang: IThirdPartyIntegrationsWizBang | null;
    doshii: IThirdPartyIntegrationsDoshii | null;
}

export interface IThirdPartyIntegrationsShift8 {
    enable: boolean;
    storeApiUrl: string;
    storeUuid: string;
    storeLocationNumber: string;
}

export interface IThirdPartyIntegrationsWizBang {
    enable: boolean;
    storeApiUrl: string;
    username: string;
    password: string;
}

export interface IThirdPartyIntegrationsDoshii {
    enable: boolean;
    clientId: string;
    clientSecret: string;
    locationId: string;
}

export enum EIntegrationType {
    SHIFT8 = "SHIFT8",
    WIZBANG = "WIZBANG",
    DOSHII = "DOSHII",
}

export interface IINTEGRATION_MAPPINGS {
    [key: string]: { id: string; itemId: string; externalItemId: string; integrationType: string };
}
