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

import {
    IDOSHII_MENU,
    IDOSHII_MENU_PRODUCT,
    IDOSHII_MENU_INCLUDED_ITEM,
    IDOSHII_MENU_OPTION,
    IDOSHII_MENU_BUNDLED_ITEM,
} from "../../model/doshiiMenu";

import axios from "axios";
import { sign } from "jsonwebtoken";

const menuAPI = (doshiiCredentials: IThirdPartyIntegrationsDoshii): Promise<IDOSHII_MENU> => {
    return new Promise(async (resolve, reject) => {
        try {
            const token = sign(
                {
                    clientId: doshiiCredentials.clientId,
                    timestamp: new Date(),
                },
                doshiiCredentials.clientSecret
            );

            const headers = {
                Authorization: "Bearer" + " " + token,
                Accept: "application/json",
                "doshii-location-id": doshiiCredentials.locationId,
            };

            const result: any = await axios({
                method: "get",
                url: `${process.env.DOSHII_API_BASE_URL}partner/v3/locations/${doshiiCredentials.locationId}/menu`,
                headers: headers,
            });

            if (result.data) resolve(result.data);
        } catch (e) {
            reject(e);
        }
    });
};

const convertDoshiiMenu = async (doshiiCredentials: IThirdPartyIntegrationsDoshii) => {
    const categories: ICategory[] = [];
    const products: IProduct[] = [];
    const categoryProductLinks: ICategoryProductLink[] = [];
    const modifierGroups: IModifierGroup[] = [];
    const productModifierGroupLinks: IProductModifierGroupLink[] = [];
    const modifierGroupModifierLinks: IModifierGroupModifierLink[] = [];
    const modifiers: IModifier[] = [];

    const doshiiMenu: IDOSHII_MENU = await menuAPI(doshiiCredentials);

    console.log("xxx...result: ", JSON.stringify(doshiiMenu));

    const processDoshiiProductOptions = (doshiiProduct?: IDOSHII_MENU_PRODUCT) => {
        doshiiProduct?.options?.forEach((doshiiOption: IDOSHII_MENU_OPTION, index: number) => {
            //Check if modifierGroup already created
            const isModifierGroupCreated = modifierGroups.some((item) => item.modifierGroupId === doshiiOption.posId);

            if (!isModifierGroupCreated) {
                const modifierGroup: IModifierGroup = {
                    modifierGroupId: doshiiOption.posId,
                    name: doshiiOption.name,
                    kitchenName: doshiiOption.alternateNames?.default.kitchen || "",
                    choiceMin: parseInt(doshiiOption.min || "0"),
                    choiceMax: parseInt(doshiiOption.max || "0"),
                    choiceDuplicate: 1, //Modifier choiceDuplicate > 1 is not support in doshii
                };

                modifierGroups.push(modifierGroup);
            }

            const productModifierGroupLink: IProductModifierGroupLink = {
                productId: doshiiProduct.posId || "",
                modifierGroupId: doshiiOption.posId,
                displaySequence: index,
            };

            productModifierGroupLinks.push(productModifierGroupLink);

            doshiiOption.variants?.forEach((doshiiVariant, index2: number) => {
                //Check if modifier already created
                const isModifierCreated = modifiers.some((item) => item.modifierId === doshiiVariant.posId);

                if (!isModifierCreated) {
                    const modifier: IModifier = {
                        modifierId: doshiiVariant.posId,
                        name: doshiiVariant.name,
                        kitchenName: doshiiVariant.alternateNames?.default.kitchen || "",
                        price: parseInt(doshiiVariant.price || "0"),
                    };

                    modifiers.push(modifier);
                }

                const modifierGroupModifierLink: IModifierGroupModifierLink = {
                    modifierGroupId: doshiiOption.posId,
                    modifierId: doshiiVariant.posId,
                    displaySequence: index2,
                };

                modifierGroupModifierLinks.push(modifierGroupModifierLink);
            });
        });
    };

    const processIncludedItems = (
        doshiiProduct: IDOSHII_MENU_PRODUCT,
        doshiiProductIncludedItem: IDOSHII_MENU_INCLUDED_ITEM,
        index: number,
        bundleMin?: string,
        bundleMax?: string
    ) => {
        //Check if product already created
        const isProductCreated = products.some((item) => item.productId === doshiiProductIncludedItem.posId);

        if (!isProductCreated) {
            const product: IProduct = {
                productId: doshiiProductIncludedItem.posId,
                name: doshiiProductIncludedItem.name,
                kitchenName: doshiiProductIncludedItem.alternateNames?.default.kitchen || "",
                price: parseInt(doshiiProductIncludedItem.unitPrice),
                skuCode: doshiiProductIncludedItem.productIds?.sku || "",
            };

            products.push(product);
        }

        processDoshiiProductOptions(doshiiProductIncludedItem);

        const doshiiProductDoshiiProductIncludedItemPosId = `${doshiiProduct.posId}_${doshiiProductIncludedItem.posId}`;

        const modifierGroup: IModifierGroup = {
            modifierGroupId: `${doshiiProductDoshiiProductIncludedItemPosId}_mg`,
            name: `${doshiiProduct.name} ${doshiiProductIncludedItem.name}`,
            choiceMin: parseInt(bundleMin || doshiiProductIncludedItem.quantity),
            choiceMax: parseInt(bundleMax || doshiiProductIncludedItem.quantity),
            choiceDuplicate: 1, //Modifier choiceDuplicate > 1 is not support in doshii
        };

        modifierGroups.push(modifierGroup);

        const productModifierGroupLink: IProductModifierGroupLink = {
            productId: doshiiProduct.posId || "",
            modifierGroupId: `${doshiiProductDoshiiProductIncludedItemPosId}_mg`,
            displaySequence: index,
        };

        productModifierGroupLinks.push(productModifierGroupLink);

        const modifier: IModifier = {
            modifierId: `${doshiiProductDoshiiProductIncludedItemPosId}_m`,
            name: `${doshiiProductIncludedItem.name}`,
            price: 0, //We don't need to worry about product modifier price
            modifierProductModifierId: doshiiProductIncludedItem.posId,
        };

        modifiers.push(modifier);

        const modifierGroupModifierLink: IModifierGroupModifierLink = {
            modifierGroupId: `${doshiiProductDoshiiProductIncludedItemPosId}_mg`,
            modifierId: `${doshiiProductDoshiiProductIncludedItemPosId}_m`,
            displaySequence: index,
        };

        modifierGroupModifierLinks.push(modifierGroupModifierLink);
    };

    //Create new categories from product tags
    doshiiMenu.products?.forEach((doshiiProduct: IDOSHII_MENU_PRODUCT) => {
        doshiiProduct.tags?.forEach((tag: string, index: number) => {
            //Check if category already created
            const isCategoryCreated = categories.some((item) => item.categoryId === tag);

            if (!isCategoryCreated) {
                const category: ICategory = {
                    categoryId: tag,
                    name: tag,
                    displaySequence: index,
                };

                categories.push(category);
            }
        });

        //Check if product already created
        const isProductCreated = products.some((item) => item.productId === doshiiProduct.posId);

        if (!isProductCreated) {
            const product: IProduct = {
                productId: doshiiProduct.posId || "",
                name: doshiiProduct.name || "",
                kitchenName: doshiiProduct.alternateNames?.default.kitchen || "",
                description: doshiiProduct.description || "",
                tags: doshiiProduct.dietary?.join(";"),
                price: parseInt(doshiiProduct.unitPrice || "0"),
                skuCode: doshiiProduct.productIds?.sku || "",
                soldOut: doshiiProduct.availability === "unavailable" ? true : false,
            };

            products.push(product);
        }

        doshiiProduct.tags?.forEach((tag: string, index: number) => {
            const categoryProductLink: ICategoryProductLink = {
                categoryId: tag,
                productId: doshiiProduct.posId || "",
                displaySequence: index,
            };

            categoryProductLinks.push(categoryProductLink);
        });

        doshiiProduct.includedItems?.forEach((doshiiProductIncludedItem: IDOSHII_MENU_INCLUDED_ITEM, index) => {
            processIncludedItems(doshiiProduct, doshiiProductIncludedItem, index);
        });

        doshiiProduct.bundledItems?.forEach((doshiiProductBundledItem: IDOSHII_MENU_BUNDLED_ITEM, index) => {
            doshiiProductBundledItem.includedItems.forEach((doshiiProductBundleIncludedItem: IDOSHII_MENU_INCLUDED_ITEM) => {
                processIncludedItems(
                    doshiiProduct,
                    doshiiProductBundleIncludedItem,
                    index,
                    doshiiProductBundledItem.min,
                    doshiiProductBundledItem.max
                );
            });
        });

        processDoshiiProductOptions(doshiiProduct);
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

export { convertDoshiiMenu };
