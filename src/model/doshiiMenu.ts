export interface IDOSHII_MENU {
    description?: string;
    imageUri?: string;
    surcounts?: IDOSHII_MENU_SURCOUNT[];
    options?: IDOSHII_MENU_OPTION[];
    products?: IDOSHII_MENU_PRODUCT[];
    categories?: IDOSHII_MENU_CATEGORY[];
    updatedAt?: string;
    createdAt?: string;
    version?: string;
    uri?: string;
}

export interface IDOSHII_MENU_SURCOUNT {
    posId: string;
    name: string;
    amount?: number | string;
    type?: "absolute" | "percentage";
}

export interface IDOSHII_MENU_OPTION {
    posId: string;
    name: string;
    min?: string;
    max?: string;
    variants?: IDOSHII_MENU_VARIANT[];
    alternateNames?: IDOSHII_MENU_ALTERNATIVE_NAMES;
    customPosId?: string;
}

interface IDOSHII_MENU_ALTERNATIVE_NAMES {
    default: {
        display?: string;
        kitchen?: string;
        default: string;
    };
    additionalProperties?: {
        display?: string;
        kitchen?: string;
        default: string;
    };
}

export interface IDOSHII_MENU_VARIANT {
    posId: string;
    name: string;
    price?: string;
    customPosId?: string;
    alternateNames?: IDOSHII_MENU_ALTERNATIVE_NAMES;
}

export interface IDOSHII_MENU_INCLUDED_ITEM {
    posId: string;
    productIds?: IDOSHII_MENU_PRODUCT_IDS;
    name: string;
    quantity: string;
    unitPrice: string;
    options: IDOSHII_MENU_OPTION[];
    alternateNames?: IDOSHII_MENU_ALTERNATIVE_NAMES;
}

export interface IDOSHII_MENU_BUNDLED_ITEM {
    posId?: string;
    name: string;
    min: string;
    max: string;
    includedItems: IDOSHII_MENU_INCLUDED_ITEM[];
}

export interface IDOSHII_MENU_PRODUCT {
    posId?: string;
    name?: string;
    type?: "bundle" | "single";
    availability?: "available" | "unavailable";
    productIds?: IDOSHII_MENU_PRODUCT_IDS;
    customPosId?: string;
    unitPrice?: string;
    description?: string;
    tags?: string[];
    dietary?: string[];
    menuDir?: string[];
    includedItems?: IDOSHII_MENU_INCLUDED_ITEM[];
    bundledItems?: IDOSHII_MENU_BUNDLED_ITEM[];
    options?: IDOSHII_MENU_OPTION[];
    surcounts?: IDOSHII_MENU_SURCOUNT[];
    alternateNames?: IDOSHII_MENU_ALTERNATIVE_NAMES;
}

export interface IDOSHII_MENU_PRODUCT_IDS {
    "gtin-8"?: string;
    "gtin-12"?: string;
    "gtin-13"?: string;
    "gtin-14"?: string;
    sku?: string;
    plu?: string;
    barcodes?: string[];
}

export interface IDOSHII_MENU_CATEGORY {
    category?: string;
    description?: string;
    displayOrder?: number;
    imageUri?: string;
    productIds?: string[];
}
