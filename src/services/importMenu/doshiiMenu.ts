import {
    ICategory,
    IProduct,
    ICategoryProductLink,
    IModifierGroup,
    IProductModifierGroupLink,
    IModifier,
    IModifierGroupModifierLink,
    IThirdPartyIntegrationsDoshii,
} from "../../model/interface";

import axios from "axios";
import { sign } from "jsonwebtoken";

const menuAPI = (doshiiCredentials: IThirdPartyIntegrationsDoshii) => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = sign(
                {
                    clientId: doshiiCredentials.clientId,
                    timestamp: new Date(),
                },
                doshiiCredentials.clientSecret
            );

            let headers = {
                Authorization: "Bearer" + " " + token,
                Accept: "application/json",
                "doshii-location-id": doshiiCredentials.locationId,
            };

            const result: any = await axios({
                method: "get",
                url: `${process.env.DOSHII_API_BASE_URL}partner/v3/locations/${doshiiCredentials.locationId}/menu`,
                headers: headers,
            });

            console.log("xxx...result: ", JSON.stringify(result));

            if (result.data) resolve(result.data);
        } catch (e) {
            reject(e);
        }
    });
};

const convertDoshiiMenu = async (doshiiCredentials: IThirdPartyIntegrationsDoshii) => {
    let categories: ICategory[] = [];
    let products: IProduct[] = [];
    let categoryProductLinks: ICategoryProductLink[] = [];
    let modifierGroups: IModifierGroup[] = [];
    let productModifierGroupLinks: IProductModifierGroupLink[] = [];
    let modifierGroupModifierLinks: IModifierGroupModifierLink[] = [];
    let modifiers: IModifier[] = [];

    let data: any = await menuAPI(doshiiCredentials);

    let productsData = data.products;
    let sequence = 0;

    productsData.map((item: any) => {
        sequence++;
        let category: ICategory = {
            categoryId: item.tags.join(" ") + "-" + sequence,
            name: item.tags.join(" "),
            kitchenName: "",
            description: "",
            displaySequence: sequence,
        };

        categories.push(category);

        let product: IProduct = {
            productId: item.posId,
            name: item.name,
            kitchenName: item.alternateNames && item.alternateNames.default ? item.alternateNames.default.kitchen : "",
            price: item.unitPrice,
            skuCode: "",
            totalQuantityAvailable: 0,
            description: item.description,
        };

        products.push(product);

        let categoryProductLink: ICategoryProductLink = {
            categoryId: item.tags.join(" ") + "-" + sequence,
            productId: item.posId,
            displaySequence: sequence,
        };

        categoryProductLinks.push(categoryProductLink);

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
                products.push(product);

                let categoryProductLink: ICategoryProductLink = {
                    categoryId: item.tags.join(" ") + "-" + sequence,
                    productId: innerItem1.posId,
                    displaySequence: sequence,
                };

                categoryProductLinks.push(categoryProductLink);

                if (innerItem1.options.length > 0) {
                    let innerOptions = innerItem1.options;

                    innerOptions.map((opt: any, index: number) => {
                        let modgroup: IModifierGroup = {
                            modifierGroupId: opt.posId,
                            name: opt.name,
                            choiceDuplicate: opt.max,
                            choiceMin: opt.min,
                            choiceMax: opt.max,
                        };

                        modifierGroups.push(modgroup);

                        let productModGroupLink: IProductModifierGroupLink = {
                            productId: innerItem1.posId,
                            modifierGroupId: opt.posId,
                            displaySequence: index,
                        };

                        productModifierGroupLinks.push(productModGroupLink);
                        if (opt.variants && opt.variants.length > 0) {
                            let variants = opt.variants;

                            variants.map((v: any, index2: number) => {
                                let modobj: IModifier = {
                                    modifierId: v.posId,
                                    name: v.name,
                                    price: v.price,
                                };
                                modifiers.push(modobj);

                                let modifierGroupModifierLink: IModifierGroupModifierLink = {
                                    modifierGroupId: opt.posId,
                                    modifierId: v.posId,
                                    displaySequence: index2,
                                };

                                modifierGroupModifierLinks.push(modifierGroupModifierLink);
                            });
                        }
                    });
                }
            });
        }

        if (item.options.length > 0) {
            let itemOptions = item.options;
            itemOptions.map((opt: any, index: number) => {
                let modgroup: IModifierGroup = {
                    modifierGroupId: opt.posId,
                    name: opt.name,
                    choiceDuplicate: opt.max,
                    choiceMin: opt.min,
                    choiceMax: opt.max,
                };

                modifierGroups.push(modgroup);

                let productModGroupLink: IProductModifierGroupLink = {
                    productId: item.posId,
                    modifierGroupId: opt.posId,
                    displaySequence: index,
                };

                productModifierGroupLinks.push(productModGroupLink);

                if (opt.variants && opt.variants.length > 0) {
                    let variants = opt.variants;

                    variants.map((v: any, index2: number) => {
                        let modobj: IModifier = {
                            modifierId: v.posId,
                            name: v.name,
                            price: v.price,
                        };

                        modifiers.push(modobj);

                        let modifierGroupModifierLink: IModifierGroupModifierLink = {
                            modifierGroupId: opt.posId,
                            modifierId: v.posId,
                            displaySequence: index2,
                        };

                        modifierGroupModifierLinks.push(modifierGroupModifierLink);
                    });
                }
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
};

export { convertDoshiiMenu };
