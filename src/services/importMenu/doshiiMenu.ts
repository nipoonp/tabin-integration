import {
    ICategory,
    IProduct,
    ICategoryProductLink,
    IModifierGroup,
    IProductModifierGroupLink,
    IModifier,
    IModifierGroupModifierLink,
} from "../../model/interface";
import { token } from "../common/generateToken";

import axios from "axios";

const menuAPI = () => {
    let headers = {
        Authorization: "Bearer" + " " + token,
        Accept: "application/json",
        "doshii-location-id": "kMMgKnGbE",
    };
    return new Promise(function (resolve, reject) {
        axios({
            method: "get",
            url: "https://sandbox.doshii.co/partner/v3/locations/kMMgKnGbE/menu",
            headers: headers,
        })
            .then(async (result: any) => {
                if (result.data) {
                    // console.log("result Data", result.data);
                    resolve(result.data);
                }
            })
            .catch((err: any) => {
                console.log(err);
                reject(err);
            });
    });
};

const convertDoshiiMenu = async () => {
    let categoryArray: ICategory[] = [];
    let productArray: IProduct[] = [];
    let categoryProductLinkArray: ICategoryProductLink[] = [];
    let modifierGroupArray: IModifierGroup[] = [];
    let productModGroupLinkArray: IProductModifierGroupLink[] = [];
    let modifierGroupModifierLinkArray: IModifierGroupModifierLink[] = [];
    let modifierArray: IModifier[] = [];

    let data: any = await menuAPI();
    let productsData = data.products;
    let sequence = 0;
    if (productsData.length > 0) {
        productsData.map((item: any) => {
            sequence++;
            let category: ICategory = {
                categoryId: item.tags.join(" ") + "-" + sequence,
                name: item.tags.join(" "),
                kitchenName: "",
                description: "",
                displaySequence: sequence,
            };
            categoryArray.push(category);

            let product: IProduct = {
                productId: item.posId,
                name: item.name,
                kitchenName: item.alternateNames && item.alternateNames.default ? item.alternateNames.default.kitchen : "",
                price: item.unitPrice,
                skuCode: "",
                totalQuantityAvailable: 0,
                description: item.description,
            };
            productArray.push(product);

            let categoryProductLink: ICategoryProductLink = {
                categoryId: item.tags.join(" ") + "-" + sequence,
                productId: item.posId,
                displaySequence: sequence,
            };
            categoryProductLinkArray.push(categoryProductLink);

            if (item.includedItems.length > 0) {
                let includedItems = item.includedItems;
                includedItems.map((innerItem1: any) => {
                    let product: IProduct = {
                        productId: innerItem1.posId,
                        name: innerItem1.name,
                        kitchenName: innerItem1.alternateNames && innerItem1.alternateNames.default ? innerItem1.alternateNames.default.kitchen : "",
                        price: innerItem1.unitPrice,
                        skuCode: "",
                        totalQuantityAvailable: innerItem1.quantity,
                        description: "",
                    };
                    productArray.push(product);

                    let categoryProductLink: ICategoryProductLink = {
                        categoryId: item.tags.join(" ") + "-" + sequence,
                        productId: innerItem1.posId,
                        displaySequence: sequence,
                    };
                    categoryProductLinkArray.push(categoryProductLink);
                    if (innerItem1.options.length > 0) {
                        let innerOptions = innerItem1.options;
                        innerOptions.map((opt: any) => {
                            let modgroup: IModifierGroup = {
                                modifierGroupId: opt.posId,
                                name: opt.name,
                                choiceDuplicate: opt.max,
                                choiceMin: opt.min,
                                choiceMax: opt.max,
                            };
                            modifierGroupArray.push(modgroup);
                            let productModGroupLink: IProductModifierGroupLink = {
                                productId: innerItem1.posId,
                                modifierGroupId: opt.posId,
                            };
                            productModGroupLinkArray.push(productModGroupLink);
                            if (opt.variants && opt.variants.length > 0) {
                                let variants = opt.variants;
                                variants.map((v: any) => {
                                    let modobj: IModifier = {
                                        modifierId: v.posId,
                                        name: v.name,
                                        price: v.price,
                                    };
                                    modifierArray.push(modobj);

                                    let modifierGroupModifierLink: IModifierGroupModifierLink = {
                                        modifierGroupId: opt.posId,
                                        modifierId: v.posId,
                                    };
                                    modifierGroupModifierLinkArray.push(modifierGroupModifierLink);
                                });
                            }
                        });
                    }
                });
            }

            if (item.options.length > 0) {
                let itemOptions = item.options;
                itemOptions.map((opt: any) => {
                    let modgroup: IModifierGroup = {
                        modifierGroupId: opt.posId,
                        name: opt.name,
                        choiceDuplicate: opt.max,
                        choiceMin: opt.min,
                        choiceMax: opt.max,
                    };
                    modifierGroupArray.push(modgroup);
                    let productModGroupLink: IProductModifierGroupLink = {
                        productId: item.posId,
                        modifierGroupId: opt.posId,
                    };
                    productModGroupLinkArray.push(productModGroupLink);
                    if (opt.variants && opt.variants.length > 0) {
                        let variants = opt.variants;
                        variants.map((v: any) => {
                            let modobj: IModifier = {
                                modifierId: v.posId,
                                name: v.name,
                                price: v.price,
                            };
                            modifierArray.push(modobj);
                            let modifierGroupModifierLink: IModifierGroupModifierLink = {
                                modifierGroupId: opt.posId,
                                modifierId: v.posId,
                            };
                            modifierGroupModifierLinkArray.push(modifierGroupModifierLink);
                        });
                    }
                });
            }
        });
    }
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
};

export { convertDoshiiMenu };
