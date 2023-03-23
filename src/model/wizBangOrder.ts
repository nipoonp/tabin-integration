export interface IWIZBANG_ORDER {
    TABLENAME: string;
    LINKCODE: string;
    ACCOUNTID: number | null;
    EATINPICKUPDELIVERY: number; //EATIN=1, TAKEAWAY/PICKUP=2, DELIVERY=3 (DEFAULT VALUE = 2)
    CUSTOMER: IWIZBANG_ORDER_CUSTOMER;
    ORDERLINES: IWIZBANG_ORDER_ORDER_LINES[];
    TENDER: IWIZBANG_ORDER_TENDER[];
}

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

export interface IWIZBANG_ORDER_ORDER_LINES {
    ITEMID: number | null;
    QTY: number | null;
    USEUNITPRICE: boolean;
    ITEMABBREV: string;
    UNITPRICE: number | null;
    SALESTAXPERCENT: number | null;
    ORDERLINEMODIFIERS: IORDER_LINE_MODIFIERS[];
}

export interface IORDER_LINE_MODIFIERS {
    MODIFIER: string;
    USEMODPRICE: boolean;
    MODPRICE: number | null;
}

export interface IWIZBANG_ORDER_TENDER {
    TENDERTYPEID: number; //Eftpos = 1, Cash = 4
    PAYMENT: number;
    TIP: number;
}
