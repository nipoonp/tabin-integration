import axios from 'axios';
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
} from '../../model/interface';
import { convertDollarsToCentsReturnInt } from '../../util/util';

import {
  IWIZBANG_MENU,
  IWIZBANG_MENU_MENU,
  IWIZBANG_MENU_MENU_FOOD_BEVERAGE,
  IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM,
  IWIZBANG_MENU_MODIFIER,
  IWIZBANG_MENU_MOD_GROUP,
} from '../../model/wizBangMenu';

const getWizBangMenu = async (wizBangCredentials: IThirdPartyIntegrationsWizBang):
Promise<IWIZBANG_MENU[]> => {
  const { username } = wizBangCredentials;
  const { password } = wizBangCredentials;
  const encodedBase64Token = Buffer.from(`${username}:${password}`).toString('base64');
  let authorization = `Basic ${encodedBase64Token}`;

  authorization = authorization.replace(/[\r\n]+/gm, '');

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: authorization,
  };

  const result = await axios({
    method: 'get',
    url: `${wizBangCredentials.storeApiUrl}wizbang/restapi/setup/menu`,
    headers,
  });

  console.log('xxx...result.data', JSON.stringify(result.data));

  return result.data.result;
};

const convertWizBangMenu = async (wizBangMenuList: IWIZBANG_MENU[]) => {
  const categories: ICategory[] = [];
  const products: IProduct[] = [];
  const categoryProductLinks: ICategoryProductLink[] = [];
  const modifierGroups: IModifierGroup[] = [];
  const productModifierGroupLinks: IProductModifierGroupLink[] = [];
  const modifierGroupModifierLinks: IModifierGroupModifierLink[] = [];
  const modifiers: IModifier[] = [];

  wizBangMenuList.forEach((data: IWIZBANG_MENU) => {
    const wizBangMenus = data.Menu;
    const wizBangModGroups = data.ModGroups;
    const wizBangModifiers = data.Modifiers;

    // Menu
    wizBangMenus.forEach((wizBangMenu: IWIZBANG_MENU_MENU) => {
      const wizBangFoods = wizBangMenu.Food;
      const wizBangBeverages = wizBangMenu.Beverage;

      // Food Category and Product
      wizBangFoods.forEach((wizBangFood: IWIZBANG_MENU_MENU_FOOD_BEVERAGE) => {
        const category: ICategory = {
          categoryId: String(wizBangFood.ItemGroupID),
          name: wizBangFood.ItemGroupName,
          kitchenName: wizBangFood.ItemGroupAbbrev,
          displaySequence: wizBangFood.ItemGroupOrder,
        };

        categories.push(category);

        const wizBangItems = wizBangFood.Items ? wizBangFood.Items : [];

        wizBangItems.forEach((wizBangItem: IWIZBANG_MENU_MENU_FOOD_BEVERAGE_ITEM) => {
          const product: IProduct = {
            productId: String(wizBangItem.ItemID),
            name: wizBangItem.ItemAbbrev,
            price: wizBangItem.ItemPrice
              ? convertDollarsToCentsReturnInt(wizBangItem.ItemPrice) : 0,
            skuCode: wizBangItem.Barcode || '',
            totalQuantityAvailable: wizBangItem.AvailQty || undefined,
          };

          products.push(product);

          const categoryProductLink: ICategoryProductLink = {
            categoryId: String(wizBangItem.ItemGroupID),
            productId: String(wizBangItem.ItemID),
            displaySequence: wizBangItem.ItemOrder,
          };

          categoryProductLinks.push(categoryProductLink);
        });
      });

      // Beverage Category and Product
      wizBangBeverages.forEach((wizBangBeverage: IWIZBANG_MENU_MENU_FOOD_BEVERAGE) => {
        const category: ICategory = {
          categoryId: String(wizBangBeverage.ItemGroupID),
          name: wizBangBeverage.ItemGroupName,
          kitchenName: wizBangBeverage.ItemGroupAbbrev,
          displaySequence: wizBangBeverage.ItemGroupOrder,
        };

        categories.push(category);

        const wizBangItems = wizBangBeverage.Items ? wizBangBeverage.Items : [];

        wizBangItems.forEach((wizBangItem) => {
          const product: IProduct = {
            productId: String(wizBangItem.ItemID),
            name: wizBangItem.ItemAbbrev,
            price: wizBangItem.ItemPrice
              ? convertDollarsToCentsReturnInt(wizBangItem.ItemPrice) : 0,
            skuCode: wizBangItem.Barcode || '',
            totalQuantityAvailable: wizBangItem.AvailQty || undefined,
          };

          products.push(product);

          const categoryProductLink: ICategoryProductLink = {
            categoryId: String(wizBangItem.ItemGroupID),
            productId: String(wizBangItem.ItemID),
            displaySequence: wizBangItem.ItemOrder,
          };

          categoryProductLinks.push(categoryProductLink);
        });
      });
    });

    // ModifierGroup, Product and modifier Link
    wizBangModGroups.forEach((wizBangModGroup: IWIZBANG_MENU_MOD_GROUP) => {
      const wizBangItems = wizBangModGroup.Items;
      const wizBangModifierss = wizBangModGroup.Modifiers;

      const modifierGroup: IModifierGroup = {
        modifierGroupId: String(wizBangModGroup.ModGroupID),
        name: wizBangModGroup.ModGroup,
        choiceDuplicate: wizBangModGroup.Multi ? 100 : 1,
        choiceMin: wizBangModGroup.Force ? 1 : 0,
        choiceMax: wizBangModGroup.Force ? 100 : 0,
      };

      wizBangItems.forEach((wizBangItem: number, index) => {
        const productModifierGroupLink: IProductModifierGroupLink = {
          productId: String(wizBangItem),
          modifierGroupId: String(wizBangModGroup.ModGroupID),
          displaySequence: index,
        };

        productModifierGroupLinks.push(productModifierGroupLink);
      });

      wizBangModifierss.forEach((wizBangModifier: number, index) => {
        const modifierGroupModifierLink: IModifierGroupModifierLink = {
          modifierGroupId: String(wizBangModGroup.ModGroupID),
          modifierId: String(wizBangModifier),
          displaySequence: index,
        };

        modifierGroupModifierLinks.push(modifierGroupModifierLink);
      });

      modifierGroups.push(modifierGroup);
    });

    // Modifier
    wizBangModifiers.forEach((wizBangModifier: IWIZBANG_MENU_MODIFIER) => {
      const modifier: IModifier = {
        modifierId: String(wizBangModifier.ModifierID),
        name: wizBangModifier.Modifier,
        price: wizBangModifier.ModPrice
          ? convertDollarsToCentsReturnInt(wizBangModifier.ModPrice) : 0,
      };

      modifiers.push(modifier);
    });
  });

  return {
    categories,
    products,
    categoryProductLinks,
    modifierGroups,
    productModifierGroupLinks,
    modifierGroupModifierLinks,
    modifiers,
  };
};

export const importWizBangMenu = async (wizBangCredentials: IThirdPartyIntegrationsWizBang) => {
  try {
    const wizBangMenu = await getWizBangMenu(wizBangCredentials);
    const tabinItem: ITABIN_ITEMS = await convertWizBangMenu(wizBangMenu);
    return tabinItem;
  } catch (e) {
    console.log('Error...', e);
    return e;
  }
};
