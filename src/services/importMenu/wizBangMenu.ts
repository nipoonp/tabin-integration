import {
    ICategory,
    IProduct,
    ICategoryProductLink,
    IModifierGroup,
    IProductModifierGroupLink,
    IModifier,
    IModifierGroupModifierLink,
    IThirdPartyIntegrationsWizBang,
} from "../../model/interface";
import { convertDollarsToCentsReturnInt } from "../../util/util";

import axios from "axios";

const menuAPI = (wizBangCredentials: IThirdPartyIntegrationsWizBang) => {
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

    return new Promise(async (resolve, reject) => {
        try {
            const result: any = await axios({
                method: "get",
                url: `${wizBangCredentials.storeApiUrl}wizbang/restapi/setup/menu`,
                headers: headers,
            });

            if (result.data) resolve(result.data);
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
};

const convertWizBangMenu = async (wizBangCredentials: IThirdPartyIntegrationsWizBang) => {
    try {
        let categories: ICategory[] = [];
        let products: IProduct[] = [];
        let categoryProductLinks: ICategoryProductLink[] = [];
        let modifierGroups: IModifierGroup[] = [];
        let productModifierGroupLinks: IProductModifierGroupLink[] = [];
        let modifierGroupModifierLinks: IModifierGroupModifierLink[] = [];
        let modifiers: IModifier[] = [];

        const data: any = await menuAPI(wizBangCredentials);

        let result = data.result;

        result.map((res: any) => {
            let menuArray = res.Menu;
            let modGroupArray = res.ModGroups;
            let modArray = res.Modifiers;
            //Menu Array
            if (menuArray.length > 0) {
                menuArray.map((menu: any) => {
                    let foodArray = menu.Food;
                    let beverageArray = menu.Beverage;

                    //Food Category and Product
                    if (foodArray.length > 0) {
                        foodArray.map((food: any) => {
                            let category: ICategory = {
                                categoryId: food.ItemGroupID,
                                name: food.ItemGroupName,
                                description: "",
                                kitchenName: food.ItemGroupAbbrev,
                                displaySequence: food.ItemGroupOrder,
                            };

                            categories.push(category);
                            let itemsArray = food.Items ? food.Items : [];

                            if (itemsArray.length > 0) {
                                itemsArray.map((item: any) => {
                                    let product: IProduct = {
                                        productId: item.ItemID,
                                        name: item.ItemAbbrev,
                                        kitchenName: "",
                                        description: "",
                                        price: convertDollarsToCentsReturnInt(item.ItemPrice),
                                        skuCode: item.Barcode,
                                        totalQuantityAvailable: item.AvailQty,
                                    };
                                    products.push(product);
                                    let categoryProductLink: ICategoryProductLink = {
                                        categoryId: item.ItemGroupID,
                                        productId: item.ItemID,
                                        displaySequence: item.ItemOrder,
                                    };
                                    categoryProductLinks.push(categoryProductLink);
                                });
                            }
                        });
                    }

                    //Beverage Category and Product
                    if (beverageArray.length > 0) {
                        beverageArray.map((bev: any) => {
                            let category: ICategory = {
                                categoryId: bev.ItemGroupID,
                                name: bev.ItemGroupName,
                                description: "",
                                kitchenName: bev.ItemGroupAbbrev,
                                displaySequence: bev.ItemGroupOrder,
                            };
                            categories.push(category);
                            let itemsArray = bev.Items ? bev.Items : [];

                            if (itemsArray.length > 0) {
                                itemsArray.map((item: any) => {
                                    let product: IProduct = {
                                        productId: item.ItemID,
                                        name: item.ItemAbbrev,
                                        kitchenName: "",
                                        description: "",
                                        price: convertDollarsToCentsReturnInt(item.ItemPrice),
                                        skuCode: item.Barcode,
                                        totalQuantityAvailable: item.AvailQty,
                                    };
                                    products.push(product);
                                    let categoryProductLink: ICategoryProductLink = {
                                        categoryId: item.ItemGroupID,
                                        productId: item.ItemID,
                                        displaySequence: item.ItemOrder,
                                    };
                                    categoryProductLinks.push(categoryProductLink);
                                });
                            }
                        });
                    }
                });
            }

            //ModifierGroup, Product and modifier Link
            if (modGroupArray.length > 0) {
                modGroupArray.map((modGroup: any) => {
                    let itemsListArray = modGroup.Items;
                    let modifierListArray = modGroup.Modifiers;

                    let modgroup: IModifierGroup = {
                        modifierGroupId: modGroup.ModGroupID,
                        name: modGroup.ModGroup,
                        choiceDuplicate: modGroup.multi ? 100 : 1,
                        choiceMin: modGroup.force ? 1 : 0,
                        choiceMax: modGroup.force ? 100 : 0,
                    };

                    if (itemsListArray.length > 0) {
                        itemsListArray.map((item: any, index) => {
                            let productModifierGroupLink: IProductModifierGroupLink = {
                                productId: item,
                                modifierGroupId: modGroup.ModGroupID,
                                displaySequence: index,
                            };
                            productModifierGroupLinks.push(productModifierGroupLink);
                        });
                    }

                    if (modifierListArray.length > 0) {
                        modifierListArray.map((modifier: any, index) => {
                            let modifierGroupModifierLink: IModifierGroupModifierLink = {
                                modifierGroupId: modGroup.ModGroupID,
                                modifierId: modifier,
                                displaySequence: index,
                            };
                            modifierGroupModifierLinks.push(modifierGroupModifierLink);
                        });
                    }

                    modifierGroups.push(modgroup);
                });
            }

            //Modifier
            if (modArray.length > 0) {
                modArray.map((modifier: any) => {
                    let modobj: IModifier = {
                        modifierId: modifier.ModifierID,
                        name: modifier.Modifier,
                        price: modifier.ModPrice ? convertDollarsToCentsReturnInt(modifier.ModPrice) : 0,
                    };
                    modifiers.push(modobj);
                });
            }
        });

        // console.log("categories", categories);
        // console.log("products", products);
        // console.log("categoryProductLinks", categoryProductLinks);
        // console.log("modifierGroups", modifierGroups);
        // console.log("productModifierGroupLinks", productModifierGroupLinks);
        // console.log("modifierGroupModifierLinks", modifierGroupModifierLinks);
        // console.log("modifiers", modifiers);

        return {
            categories: categories,
            products: products,
            categoryProductLinks: categoryProductLinks,
            modifierGroups: modifierGroups,
            productModifierGroupLinks: productModifierGroupLinks,
            modifierGroupModifierLinks: modifierGroupModifierLinks,
            modifiers: modifiers,
        };
    } catch (err) {
        throw err;
    }
};

export { convertWizBangMenu };
