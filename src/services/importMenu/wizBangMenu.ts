import {
    ICategory,
    IProduct,
    ICategoryProductLink,
    IModifierGroup,
    IProductModifierGroupLink,
    IModifier,
    IModifierGroupModifierLink,
    IThirdPartyIntegrationsWizBang,
    ITABIN_ITEMS,
} from "../../model/interface";
import { convertDollarsToCentsReturnInt } from "../../util/util";

import axios from "axios";
import {
    IWIZBANG_MENU,
    IWIZBANG_MENU_MENU,
    IWIZBANG_MENU_MENU_FOOD_BEVERAGE,
    IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM,
    IWIZBANG_MENU_MODIFIER,
    IWIZBANG_MENU_MOD_GROUP,
} from "../../model/wizBangMenu";

const getWizBangMenu = async (wizBangCredentials: IThirdPartyIntegrationsWizBang): Promise<IWIZBANG_MENU[]> => {
    let username = wizBangCredentials.username;
    let password = wizBangCredentials.password;
    let encodedBase64Token = Buffer.from(`${username}:${password}`).toString("base64");
    let authorization = `Basic ${encodedBase64Token}`;

    authorization = authorization.replace(/[\r\n]+/gm, "");

    let headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorization,
    };

    const result = await axios({
        method: "get",
        url: `${wizBangCredentials.storeApiUrl}wizbang/restapi/setup/menu`,
        headers: headers,
    });

    return result.data.result;
};

const convertWizBangMenu = async (wizBangMenu: IWIZBANG_MENU[]) => {
    let categories: ICategory[] = [];
    let products: IProduct[] = [];
    let categoryProductLinks: ICategoryProductLink[] = [];
    let modifierGroups: IModifierGroup[] = [];
    let productModifierGroupLinks: IProductModifierGroupLink[] = [];
    let modifierGroupModifierLinks: IModifierGroupModifierLink[] = [];
    let modifiers: IModifier[] = [];

    wizBangMenu.forEach((data: IWIZBANG_MENU) => {
        let wizBangMenus = data.Menu;
        let wizBangModGroups = data.ModGroups;
        let wizBangModifiers = data.Modifiers;

        //Menu
        wizBangMenus.forEach((wizBangMenu: IWIZBANG_MENU_MENU) => {
            let wizBangFoods = wizBangMenu.Food;
            let wizBangBeverages = wizBangMenu.Beverage;

            //Food Category and Product
            wizBangFoods.forEach((wizBangFood: IWIZBANG_MENU_MENU_FOOD_BEVERAGE) => {
                let category: ICategory = {
                    categoryId: String(wizBangFood.ItemGroupID),
                    name: wizBangFood.ItemGroupName,
                    kitchenName: wizBangFood.ItemGroupAbbrev,
                    displaySequence: wizBangFood.ItemGroupOrder,
                };

                categories.push(category);

                let wizBangItems = wizBangFood.Items ? wizBangFood.Items : [];

                wizBangItems.forEach((wizBangItem: IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM) => {
                    let product: IProduct = {
                        productId: String(wizBangItem.ItemID),
                        name: wizBangItem.ItemAbbrev,
                        price: wizBangItem.ItemPrice ? convertDollarsToCentsReturnInt(wizBangItem.ItemPrice) : 0,
                        skuCode: wizBangItem.Barcode || "",
                        totalQuantityAvailable: wizBangItem.AvailQty || undefined,
                    };

                    products.push(product);

                    let categoryProductLink: ICategoryProductLink = {
                        categoryId: String(wizBangItem.ItemGroupID),
                        productId: String(wizBangItem.ItemID),
                        displaySequence: wizBangItem.ItemOrder,
                    };

                    categoryProductLinks.push(categoryProductLink);
                });
            });

            //Beverage Category and Product
            wizBangBeverages.forEach((wizBangBeverage: IWIZBANG_MENU_MENU_FOOD_BEVERAGE) => {
                let category: ICategory = {
                    categoryId: String(wizBangBeverage.ItemGroupID),
                    name: wizBangBeverage.ItemGroupName,
                    kitchenName: wizBangBeverage.ItemGroupAbbrev,
                    displaySequence: wizBangBeverage.ItemGroupOrder,
                };

                categories.push(category);

                let wizBangItems = wizBangBeverage.Items ? wizBangBeverage.Items : [];

                wizBangItems.forEach((wizBangItem) => {
                    let product: IProduct = {
                        productId: String(wizBangItem.ItemID),
                        name: wizBangItem.ItemAbbrev,
                        price: wizBangItem.ItemPrice ? convertDollarsToCentsReturnInt(wizBangItem.ItemPrice) : 0,
                        skuCode: wizBangItem.Barcode || "",
                        totalQuantityAvailable: wizBangItem.AvailQty || undefined,
                    };

                    products.push(product);

                    let categoryProductLink: ICategoryProductLink = {
                        categoryId: String(wizBangItem.ItemGroupID),
                        productId: String(wizBangItem.ItemID),
                        displaySequence: wizBangItem.ItemOrder,
                    };

                    categoryProductLinks.push(categoryProductLink);
                });
            });
        });

        //ModifierGroup, Product and modifier Link
        wizBangModGroups.forEach((wizBangModGroup: IWIZBANG_MENU_MOD_GROUP) => {
            let wizBangItems = wizBangModGroup.Items;
            let wizBangModifiers = wizBangModGroup.Modifiers;

            let modifierGroup: IModifierGroup = {
                modifierGroupId: String(wizBangModGroup.ModGroupID),
                name: wizBangModGroup.ModGroup,
                choiceDuplicate: wizBangModGroup.Multi ? 100 : 1,
                choiceMin: wizBangModGroup.Force ? 1 : 0,
                choiceMax: wizBangModGroup.Force ? 100 : 0,
            };

            wizBangItems.forEach((wizBangItem: number, index) => {
                let productModifierGroupLink: IProductModifierGroupLink = {
                    productId: String(wizBangItem),
                    modifierGroupId: String(wizBangModGroup.ModGroupID),
                    displaySequence: index,
                };

                productModifierGroupLinks.push(productModifierGroupLink);
            });

            wizBangModifiers.forEach((wizBangModifier: number, index) => {
                let modifierGroupModifierLink: IModifierGroupModifierLink = {
                    modifierGroupId: String(wizBangModGroup.ModGroupID),
                    modifierId: String(wizBangModifier),
                    displaySequence: index,
                };

                modifierGroupModifierLinks.push(modifierGroupModifierLink);
            });

            modifierGroups.push(modifierGroup);
        });

        //Modifier
        wizBangModifiers.forEach((wizBangModifier: IWIZBANG_MENU_MODIFIER) => {
            let modifier: IModifier = {
                modifierId: String(wizBangModifier.ModifierID),
                name: wizBangModifier.Modifier,
                price: wizBangModifier.ModPrice ? convertDollarsToCentsReturnInt(wizBangModifier.ModPrice) : 0,
            };

            modifiers.push(modifier);
        });
    });

    return {
        categories: categories,
        products: products,
        categoryProductLinks: categoryProductLinks,
        modifierGroups: modifierGroups,
        productModifierGroupLinks: productModifierGroupLinks,
        modifierGroupModifierLinks: modifierGroupModifierLinks,
        modifiers: modifiers,
    };
};

export const importWizBangMenu = async (wizBangCredentials: IThirdPartyIntegrationsWizBang) => {
    try {
        const wizBangMenu = await getWizBangMenu(wizBangCredentials);
        const tabinItem: ITABIN_ITEMS = await convertWizBangMenu(wizBangMenu);

        console.log("xxx...wizBangMenu", JSON.stringify(wizBangMenu));

        return tabinItem;
    } catch (e) {
        console.log("Error...", e);
    }
};
