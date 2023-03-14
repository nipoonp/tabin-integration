import {
    ICategory,
    IProduct,
    ICategoryProductLink,
    IModifierGroup,
    IProductModifierGroupLink,
    IModifier,
    IModifierGroupModifierLink,
} from "../../model/interface";

import axios from "axios";

const menuAPI = () => {
    let username = "admin";
    let password = "admin";
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
                url: "http://203.109.232.106:5585/wizbang/restapi/setup/menu",
                headers: headers,
            });

            if (result.data) resolve(result.data);
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
};

const convertWizBangMenu = async () => {
    try {
        let categoryArray: ICategory[] = [];
        let productArray: IProduct[] = [];
        let categoryProductLinkArray: ICategoryProductLink[] = [];
        let modifierGroupArray: IModifierGroup[] = [];
        let productModGroupLinkArray: IProductModifierGroupLink[] = [];
        let modifierGroupModifierLinkArray: IModifierGroupModifierLink[] = [];
        let modifierArray: IModifier[] = [];

        const data: any = await menuAPI();

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

                            categoryArray.push(category);
                            let itemsArray = food.Items ? food.Items : [];

                            if (itemsArray.length > 0) {
                                itemsArray.map((item: any) => {
                                    let product: IProduct = {
                                        productId: item.ItemID,
                                        name: item.ItemAbbrev,
                                        kitchenName: "",
                                        description: "",
                                        price: item.ItemPrice,
                                        skuCode: item.Barcode,
                                        totalQuantityAvailable: item.AvailQty,
                                    };
                                    productArray.push(product);
                                    let categoryProductLink: ICategoryProductLink = {
                                        categoryId: item.ItemGroupID,
                                        productId: item.ItemID,
                                        displaySequence: item.ItemOrder,
                                    };
                                    categoryProductLinkArray.push(categoryProductLink);
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
                            categoryArray.push(category);
                            let itemsArray = bev.Items ? bev.Items : [];

                            if (itemsArray.length > 0) {
                                itemsArray.map((item: any) => {
                                    let product: IProduct = {
                                        productId: item.ItemID,
                                        name: item.ItemAbbrev,
                                        kitchenName: "",
                                        description: "",
                                        price: item.ItemPrice,
                                        skuCode: item.Barcode,
                                        totalQuantityAvailable: item.AvailQty,
                                    };
                                    productArray.push(product);
                                    let categoryProductLink: ICategoryProductLink = {
                                        categoryId: item.ItemGroupID,
                                        productId: item.ItemID,
                                        displaySequence: item.ItemOrder,
                                    };
                                    categoryProductLinkArray.push(categoryProductLink);
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
                        itemsListArray.map((item: any) => {
                            let productModGroupLink: IProductModifierGroupLink = {
                                productId: item,
                                modifierGroupId: modGroup.ModGroupID,
                            };
                            productModGroupLinkArray.push(productModGroupLink);
                        });
                    }

                    if (modifierListArray.length > 0) {
                        modifierListArray.map((modifier: any) => {
                            let modifierGroupModifierLink: IModifierGroupModifierLink = {
                                modifierGroupId: modGroup.ModGroupID,
                                modifierId: modifier,
                            };
                            modifierGroupModifierLinkArray.push(modifierGroupModifierLink);
                        });
                    }

                    modifierGroupArray.push(modgroup);
                });
            }

            //Modifier
            if (modArray.length > 0) {
                modArray.map((modifier: any) => {
                    let modobj: IModifier = {
                        modifierId: modifier.ModifierID,
                        name: modifier.Modifier,
                        price: modifier.ModPrice,
                    };
                    modifierArray.push(modobj);
                });
            }
        });

        // console.log("categoryArray", categoryArray);
        // console.log("productArray", productArray);
        // console.log("categoryProductLinkArray", categoryProductLinkArray);
        // console.log("modifierGroupArray", modifierGroupArray);
        // console.log("productModGroupLinkArray", productModGroupLinkArray);
        // console.log("modifierGroupModifierLinkArray", modifierGroupModifierLinkArray);
        // console.log("modifierArray", modifierArray);

        return {
            categoryArray: categoryArray,
            productArray: productArray,
            categoryProductLinkArray: categoryProductLinkArray,
            modifierGroupArray: modifierGroupArray,
            productModGroupLinkArray: productModGroupLinkArray,
            modifierGroupModifierLinkArray: modifierGroupModifierLinkArray,
            modifierArray: modifierArray,
        };
    } catch (err) {
        throw err;
    }
};

export { convertWizBangMenu };
