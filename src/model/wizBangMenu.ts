export interface IWIZBANG_MENU {
    Menu: IWIZBANG_MENU_MENU[];
    Courses: any[];
    Modifiers: IWIZBANG_MENU_MODIFIER[];
    ModGroups: IWIZBANG_MENU_MOD_GROUP[];
}

export interface IWIZBANG_MENU_MENU {
    SuperItemGroupID: null;
    OutletID: null;
    SuperItemGroupName: null;
    SuperItemGroupAbbrev: null;
    SuperItemGroupOrder: null;
    WhenUpd: null;
    WhenDeleted: null;
    LoginID: null;
    HideForB: boolean;
    Food: IWIZBANG_MENU_MENU_FOOD_BEVERAGE[];
    Beverage: IWIZBANG_MENU_MENU_FOOD_BEVERAGE[];
}

export interface IWIZBANG_MENU_MENU_FOOD_BEVERAGE {
    ItemGroupID: number;
    OutletID: number;
    ForB: ForB;
    ItemGroupAbbrev: string;
    ItemGroupName: string;
    ItemGroupOrder: number;
    ItemGroupColor: string;
    WhenDeleted: null;
    LoginID: number;
    WhenUpd: string;
    ItemGroupFontColor: string;
    SalesTaxPercent: number;
    PositionPrompt: null;
    Surcharge: boolean;
    SuperItemGroupID: null;
    SaleCategoryID: null;
    LoyaltyPoints1RatioNum: null;
    LoyaltyPoints1RatioDEN: null;
    LoyaltyPoints1QTY: null;
    LoyaltyPoints2RatioNUM: null;
    LoyaltyPoints2RatioDEN: number | null;
    LoyaltyPoints2QTY: null;
    LinkCode: null;
    GLCode: null;
    GLCode2: null;
    CST_ICMS: null;
    ItemGrpType: null;
    TaxSituation: null;
    CheckSum: null;
    SwipeReplacementGrp: boolean;
    RemoteOverrideGroupID: null;
    RemoteOverrideGroupName: null;
    NCMProductCode: null;
    CEST: null;
    Items?: IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM[];
}

export enum ForB {
    B = "B",
    F = "F",
}

export interface IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM {
    ItemID: number;
    OutletID: number;
    OutletName: string;
    SpecialPrice: null;
    ItemButton: boolean;
    ItemCaption: null;
    ItemAbbrev: string;
    ItemPrice: number | null;
    CourseID: null;
    CourseName: null;
    Special: boolean;
    Happy: boolean;
    ItemOrder: number;
    ItemGroupID: number;
    WhenDeleted: null;
    LoginID: number;
    WhenUpd: string;
    DontPrintZero: boolean;
    ItemPrice2: number | null;
    ItemPrice3: number | null;
    ItemPrice4: number | null;
    ItemPrice5: number | null;
    ItemPrice6: number | null;
    LocalPrice: number | null;
    LocalPrice2: number | null;
    LocalPrice3: number | null;
    LocalPrice4: number | null;
    LocalPrice5: number | null;
    LocalPrice6: number | null;
    PriceExcludesTax: boolean;
    OpenPrice: boolean;
    OpenPriceMin: number | null;
    OpenPriceMax: number | null;
    NonStockPrice: null;
    EnterQty: null;
    Barcode: null;
    AvailQty: null;
    LoyaltyPoints1RatioNUM: null;
    LoyaltyPoints1RatioDEN: null;
    LoyaltyPoints1QTY: null;
    LoyaltyPoints2RatioNUM: null;
    LoyaltyPoints2RatioDEN: number | null;
    LoyaltyPoints2QTY: null;
    NYPriceMin: null;
    NYPriceMax: null;
    NYIncPeriod: null;
    NYIncUnits: null;
    NYIncAmount: null;
    NYDecPeriod: null;
    NYDecUnits: null;
    NYDecAmount: null;
    Linkcode: null;
    WeighedItem: boolean;
    ItemName: string;
    GlobalTradeNumber: null;
    ManufacturedBy: string | null;
    TaxSituation: null;
    IATIndicator: null;
    IsService: boolean;
    CST_ICMS: null;
    CST_IPI: null;
    CST_PIS: null;
    CST_COFFINS: null;
    CSOSN: null;
    CheckSum: null;
    RemoteOverrideGroupID: null;
    RemoteOverrideGroupName: null;
    SizeID: number;
    SizeName: SizeName;
    ParentItemID: number | null;
    NCMProductCode: null;
    ParentItemInSelection: boolean;
    CFOP: null;
    CEST: null;
}

export enum SizeName {
    Default = "DEFAULT",
    Option = "OPTION",
    Option1 = "OPTION1",
    Option2 = "OPTION2",
    Option3 = "OPTION3",
    Option4 = "OPTION4",
    Option5 = "OPTION5",
}

export interface IWIZBANG_MENU_MOD_GROUP {
    ModGroupID: number;
    ModGroup: string;
    ForB: ForB;
    Force: boolean;
    Multi: boolean;
    Prompt: boolean;
    Proceed: boolean;
    Modifiers: number[];
    Items: number[];
}

export interface IWIZBANG_MENU_MODIFIER {
    ModifierID: number;
    Modifier: string;
    ModPrice: null;
    ForB: ForB;
}
