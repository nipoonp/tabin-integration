import { v4 as uuidv4 } from 'uuid';
import { EIntegrationType, ITABIN_ITEMS } from '../../model/interface';

const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const createTabinItems = async (
  tabinItems: ITABIN_ITEMS,
  integrationType: EIntegrationType,
  restaurantId: string,
  restaurantManagerId: string,
) => {
  const {
    categories,
    products,
    categoryProductLinks,
    modifierGroups,
    productModifierGroupLinks,
    modifierGroupModifierLinks, modifiers,
  } = tabinItems;

  const categoryIds = {};
  const productIds = {};
  const modifierGroupIds = {};
  const modifierIds = {};

  const now = new Date().toISOString();

  categories.forEach(async (category) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.CATEGORY_TABLE_NAME,
      Item: {
        id: `${uuid}_${category.categoryId}`,
        name: category.name,
        kitchenName: category.kitchenName || undefined,
        description: category.description || undefined,
        displaySequence: category.displaySequence,
        categoryRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    categoryIds[category.categoryId] = `${uuid}_${category.categoryId}`;

    await ddb.put(params).promise();
  });

  products.forEach(async (product) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.PRODUCT_TABLE_NAME,
      Item: {
        id: `${uuid}_${product.productId}`,
        name: product.name,
        kitchenName: product.kitchenName || undefined,
        description: product.description || undefined,
        tags: product.tags || undefined,
        price: product.price,
        skuCode: product.skuCode || undefined,
        totalQuantityAvailable: product.totalQuantityAvailable || undefined,
        productRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    productIds[product.productId] = `${uuid}_${product.productId}`;

    await ddb.put(params).promise();
  });

  modifierGroups.forEach(async (modifierGroup) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.MODIFIER_GROUP_TABLE_NAME,
      Item: {
        id: `${uuid}_${modifierGroup.modifierGroupId}`,
        name: modifierGroup.name,
        kitchenName: modifierGroup.kitchenName,
        choiceMin: modifierGroup.choiceMin,
        choiceDuplicate: modifierGroup.choiceDuplicate,
        choiceMax: modifierGroup.choiceMax,
        modifierGroupRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    modifierGroupIds[modifierGroup.modifierGroupId] = `${uuid}_${modifierGroup.modifierGroupId}`;

    await ddb.put(params).promise();
  });

  modifiers.forEach(async (modifier) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.MODIFIER_TABLE_NAME,
      Item: {
        id: `${uuid}_${modifier.modifierId}`,
        name: modifier.name,
        kitchenName: modifier.kitchenName,
        price: modifier.price,
        modifierProductModifierId: modifier.modifierProductModifierId
          ? productIds[modifier.modifierProductModifierId] : undefined,
        modifierRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    modifierIds[modifier.modifierId] = `${uuid}_${modifier.modifierId}`;

    await ddb.put(params).promise();
  });

  categoryProductLinks.forEach(async (categoryProductLink) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.CATEGORY_PRODUCT_LINK_TABLE_NAME,
      Item: {
        id: uuid,
        displaySequence: categoryProductLink.displaySequence,
        categoryProductLinkCategoryId: categoryIds[categoryProductLink.categoryId],
        categoryProductLinkProductId: productIds[categoryProductLink.productId],
        categoryProductLinkRestaurantId: restaurantId,
        owner: restaurantManagerId,
      },
    };

    await ddb.put(params).promise();
  });

  productModifierGroupLinks.forEach(async (productModifierGroupLink) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.PRODUCT_MODIFIER_GROUP_LINK_TABLE_NAME,
      Item: {
        id: uuid,
        displaySequence: productModifierGroupLink.displaySequence,
        productModifierGroupLinkProductId: productIds[
          productModifierGroupLink.productId
        ],
        productModifierGroupLinkModifierGroupId: modifierGroupIds[
          productModifierGroupLink.modifierGroupId
        ],
        productModifierGroupLinkRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
  });

  modifierGroupModifierLinks.forEach(async (modifierGroupModifierLink) => {
    const uuid = uuidv4();
    const params = {
      TableName: process.env.MODIFIER_GROUP_MODIFIER_LINK_TABLE_NAME,
      Item: {
        id: uuid,
        displaySequence: modifierGroupModifierLink.displaySequence,
        modifierGroupModifierLinkModifierGroupId: modifierGroupIds[
          modifierGroupModifierLink.modifierGroupId
        ],
        modifierGroupModifierLinkModifierId: modifierIds[modifierGroupModifierLink.modifierId],
        modifierGroupModifierLinkRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
  });

  // Integration Mapping
  products.forEach(async (product) => {
    const params = {
      TableName: process.env.INTEGRATION_MAPPING_TABLE_NAME,
      Item: {
        id: `${productIds[product.productId]}_${integrationType}`,
        itemId: productIds[product.productId],
        externalItemId: product.productId,
        integrationType,
        integrationMappingRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
  });

  modifierGroups.forEach(async (modifierGroup) => {
    const params = {
      TableName: process.env.INTEGRATION_MAPPING_TABLE_NAME,
      Item: {
        id: `${modifierGroupIds[modifierGroup.modifierGroupId]}_${integrationType}`,
        itemId: modifierGroupIds[modifierGroup.modifierGroupId],
        externalItemId: modifierGroup.modifierGroupId,
        integrationType,
        integrationMappingRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
  });

  modifiers.forEach(async (modifier) => {
    const params = {
      TableName: process.env.INTEGRATION_MAPPING_TABLE_NAME,
      Item: {
        id: `${modifierIds[modifier.modifierId]}_${integrationType}`,
        itemId: modifierIds[modifier.modifierId],
        externalItemId: modifier.modifierId,
        integrationType,
        integrationMappingRestaurantId: restaurantId,
        owner: restaurantManagerId,
        createdAt: now,
        updatedAt: now,
      },
    };

    await ddb.put(params).promise();
  });
};

export { createTabinItems };
