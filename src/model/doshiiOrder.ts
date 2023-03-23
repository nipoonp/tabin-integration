export interface IDOSHII_CREATE_ORDER {
    order: IDOSHII_ORDER;
    consumer?: IDOSHII_CONSUMER;
    transactions?: IDOSHII_TRANSACTION[];
    members?: string[];
    posTerminalId?: string;
}

export interface IDOSHII_ORDER {
    checkinId?: string; //Id of the Checkin resource example: 3
    externalOrderRef?: string; //The optional external order reference provided by the App when the order was created.
    manuallyProcessed?: boolean; //The order has been verified by a human, pass through "status"
    status?: EDOSHII_ORDER_STATUS; //The current state of the Order.
    type?: EDOSHII_ORDER_TYPE; //The type of order should be one of the following
    revenueCentre?: string; //The revenue or cost centre that this order should be allocated to
    disablePrinting?: boolean; //When the App partner provides its own printers in venue and wishes to inform the POS not to print a docket (NB: This has very limited POS support, please speak with the Integrations team)
    notes?: string; //Free-text entry for order or delivery notes such as "deliver to back door", up to a maximum of 255 characters (anything beyond will be truncated).
    requiredAt?: string; //A DateTime for when the Order is required. Will be null if not a future Order. example: 2019-01-01T12:00:00.000Z
    availableEta?: string; //An estimated DateTime for when the Order is available for pickup/delivery. Will be null if immediately available. example: 2019-01-01T12:00:00.000Z
    items?: IDOSHII_ORDER_ITEM[];
    surcounts?: IDOSHII_ORDER_SURCOUNT[];
    taxes?: IDOSHII_ORDER_TAX[]; //Array of taxes that are associated to the order
    log?: IDOSHII_ORDER_LOG;
}

export enum EDOSHII_ORDER_STATUS {
    pending = "pending",
    rejected = "rejected",
    accepted = "accepted",
    complete = "complete",
    cancelled = "cancelled",
    venue_cancelled = "venue_cancelled",
}

export enum EDOSHII_ORDER_TYPE {
    delivery = "delivery",
    pickup = "pickup",
    dinein = "dinein",
}

export interface IDOSHII_ORDER_ITEM {
    posId?: string; //The POS id of the Product
    name?: string; //The display name of the Product
    quantity?: number; //The quantity ordered
    description?: string; //A short description of the Product
    unitPrice?: string; //The price of the Product in cents
    totalBeforeSurcounts?: string; //The price of the line item before the Surcounts are applied
    totalAfterSurcounts?: string; //The price of the line item after the Surcounts are applied
    tags?: string[]; //Array of strings to help group Products together
    type?: "single" | "bundle"; //Either a type of 'single' or 'bundle'. Defaults to 'single'
    includedItems?: IDOSHII_ORDER_ITEM_INCLUDED_ITEM[]; //Array of items that are included in a bundle
    surcounts?: IDOSHII_ORDER_SURCOUNT[]; //Array of Surcount objects that can be applied to a Product
    taxes?: IDOSHII_ORDER_TAX[]; //Array of taxes that are associated to the order item
    options?: IDOSHII_ORDER_ITEM_OPTION[]; //Array of options that can be added to the Product
}

export interface IDOSHII_ORDER_ITEM_INCLUDED_ITEM {
    posId?: string;
    name?: string;
    quantity?: number;
    unitPrice?: string;
    options?: IDOSHII_ORDER_ITEM_OPTION[];
}

export interface IDOSHII_ORDER_ITEM_OPTION {
    posId?: string; //The POS id of the option
    name?: string; //The display name of the option
    variants?: IDOSHII_ORDER_ITEM_OPTION_VARIANT[]; //The available Variants for the option
}

export interface IDOSHII_ORDER_ITEM_OPTION_VARIANT {
    posId?: string; //The POS id of the Variant
    name?: string; //The display name of the Variant
    price?: string; //The price of the Variant in cents
}

export interface IDOSHII_ORDER_TAX {
    posId?: string; //The POS id of the Tax
    name?: string; //The display name
    amount?: string; //The amount of the Tax
    type?: "absolute" | "percentage"; //Whether this is an 'absolute' or 'percentage' based tax
    taxType?: "inclusive" | "exclusive"; //Whether this is an 'inclusive' or 'exclusive' tax
    value?: string | number; //The value of the tax in cents. Accepts integer or string of integers. This value should be calculated if the Tax is % based.
}

export interface IDOSHII_ORDER_LOG {
    employeePosRef?: string; //Employee POS reference
    employeeName?: string; //Employee name
    deviceRef?: string; //Device reference
    deviceName?: string; //Name of device example: MODEL A1
    area?: string; //Area example: Main dining hall
}

export interface IDOSHII_CONSUMER {
    name: string; //Consumer name
    email?: string; //Consumer email
    phone?: string; //Consumer phone
    marketingOptIn?: boolean; //Indicates whether or not the consumer is opting in to any future marketing. If the property is omitted, it implies that the current setting should remain as-is.
    address?: {
        line1?: string; //The street number and name
        line2?: string; //Apartment/unit/level/suite
        city?: string; //City
        state?: string; //State
        postalCode?: string; //Postal code
        country?: string; //2-character Country Code.
        notes?: string; //Free-text entry for notes about the Consumer's address such as "Beware of dog".
    };
    codes?: string[]; //Special properties for the consumer. example: ["Smoker", "Pensioner"]
    vipTier?: string; //VIP status of the consumer example: Premium
}

export interface IDOSHII_TRANSACTION {
    amount: number; //An integer for the number of cents to be paid
    reference?: string; //A free-text field for entering external identifiers eg- bank deposit reference no.
    invoice?: string; //External identifiers eg- Invoice number or bank deposit reference no.
    linkedTrxId?: string; //The linked transaction ids if this transaction is a refund
    method?: EDOSHII_TRANSACTION_METHOD; //Describes the payment method used
    tip?: number; //An optional integer for the number of cents transferred as a tip (additional to amount)
    rounding?: number; //An optional integer to describe any rounding in cents that may have occurred due to cash payment. This property can only be supplied with a value when the payment method is cash.
    currencyCode?: string; //An ISO-4217 currency code to describe the currency used during payment
    trn?: string; //An optional string for tracking the Transaction Reference Number (TRN)
    prepaid?: boolean; //If the Transaction has already been performed. Doshii will respond on behalf of the Partner when the POS requests payment and will notify when complete or rejected.
    surcounts?: IDOSHII_ORDER_SURCOUNT[]; //Array of Surcount objects. Typically used for payment surcharges (credit card fees, etc). See Surcounts- Surcharges & Discounts for more information on how these work.
}

export enum EDOSHII_TRANSACTION_METHOD {
    cash = "cash",
    visa = "visa",
    mastercard = "mastercard",
    eftpos = "eftpos",
    amex = "amex",
    diners = "diners",
    giftcard = "giftcard",
    loyalty = "loyalty",
    credit = "credit",
    crypto = "crypto",
    directdeposit = "directdeposit",
    cheque = "cheque",
    alipay = "alipay",
    wechatpay = "wechatpay",
    zip = "zip",
    moto = "moto",
    paypal = "paypal",
    other = "other",
}

export interface IDOSHII_ORDER_SURCOUNT {
    posId: string; //The POS id of the Surcount
    name: string; //The display name
    description: string; //Description of item.
    amount: number | string; //The amount to surcharge/discount (positive/negative number/string). This property can contain floating points to describe decimal percentage (12.5%).
    type: string; ////Whether this is a 'absolute' or 'percentage'
    value: string; //The value of the surcounts in cents. Accepts integer or string of integers. This value should be calculated if the Surcount is % based.
}
