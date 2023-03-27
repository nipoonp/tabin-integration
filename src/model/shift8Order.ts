export interface SHIFT8_ORDER_ITEM_MOD {
    ModPLU: number;
    ModName: string;
    ModIncTax: number;
    ModTax: number;
    ModExTax: number;
    ModTaxRate: number;
    ModNotes: string;
}

export interface SHIFT8_ORDER_ITEM {
    ItemID: number;
    ItemPLU: number;
    ItemName: string;
    ItemIncTax: number;
    ItemTax: number;
    ItemExTax: number;
    ItemTaxRate: number;
    ItemNotes: string;
    ItemMods: SHIFT8_ORDER_ITEM_MOD[];
}

export interface SHIFT8_ORDER_PAYMENT_MEDIA {
    PaymentTypeNumber: string;
    PaymentMediaName: string;
    PaymentAmount: number;
    PaymentReferenceNumber: string;
}

export interface SHIFT8_ORDER_CUSTOMER_DETAILS {
    FirstName: string;
    LastName: string;
    Phone: string;
    Email: string;
}

export interface SHIFT8_CREATE_ORDER {
    SaleTotalIncTax: number;
    SaleTotalTax: number;
    SaleTotalExTax: number;
    SaleDate: string;
    FulfillmentDate: string;
    LocationNumber: string;
    ReceiptNumber: number;
    SaleText: string;
    OrderTypeID: number;
    OrderNotes: string;
    Items: SHIFT8_ORDER_ITEM[];
    PaymentMedia: SHIFT8_ORDER_PAYMENT_MEDIA;
    CustomerDetails: SHIFT8_ORDER_CUSTOMER_DETAILS;
    ResponseURL: string;
}
