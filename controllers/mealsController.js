const { getMeals, setMeals, getNextMealId } = require("../models/mealsData"); //grab data functions
const { successResponse, errorResponse } = require("../utils/responseHelper"); //grab helpers

function isValidNumericId(id) { //check if id is a good number
  const parsedId = Number(id); //make it a number
  return Number.isInteger(parsedId) && parsedId > 0; //must be positive whole number
}

function calculateTotals(items) { //calculate the total nutrients
  let totalCalories = 0; //start counting
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (let i = 0; i < items.length; i++) { //loop through items
    totalCalories += Number(items[i].calories) || 0; //add it up
    totalProtein += Number(items[i].protein) || 0;
    totalCarbs += Number(items[i].carbs) || 0;
    totalFat += Number(items[i].fat) || 0;
  }

  return { //give back the totals
    totalCalories: Number(totalCalories.toFixed(1)), //round it to 1 decimal
    totalProtein: Number(totalProtein.toFixed(1)),
    totalCarbs: Number(totalCarbs.toFixed(1)),
    totalFat: Number(totalFat.toFixed(1))
  };
}

function validateMealBody(body) { //check if meal info is good
  if (!body.userId) { //if no user
    return { //send error details
      isValid: false,
      field: "userId",
      message: "Missing required field: userId"
    };
  }

  if (!body.mealName) { //if no meal name
    return { //send error details
      isValid: false,
      field: "mealName",
      message: "Missing required field: mealName"
    };
  }

  if (!body.mealDate) { //if no date
    return { //send error details
      isValid: false,
      field: "mealDate",
      message: "Missing required field: mealDate"
    };
  }

  if (!Array.isArray(body.items)) { //if items isn't a list
    return { //send error details
      isValid: false,
      field: "items",
      message: "Missing required field: items must be an array"
    };
  }

  if (body.items.length === 0) { //if no items in list
    return { //send error details
      isValid: false,
      field: "items",
      message: "Meal must include at least one food item"
    };
  }

  for (let i = 0; i < body.items.length; i++) { //loop through items
    const item = body.items[i]; //grab an item

    if (!item.foodName) { //if no food name
      return { //send error details
        isValid: false,
        field: `items[${i}].foodName`,
        message: "Missing required field: foodName"
      };
    }

    if (!item.confirmedPortionGrams) { //if no portion
      return { //send error details
        isValid: false,
        field: `items[${i}].confirmedPortionGrams`,
        message: "Missing required field: confirmedPortionGrams"
      };
    }

    const nutrients = ['calories', 'protein', 'carbs', 'fat']; //nutrients we need

    for (const n of nutrients) { //loop through nutrients
      if (body.items[i][n] === undefined || body.items[i][n] === null) { //if missing
        return { //send error details
          isValid: false,
          field: `items[${i}].${n}`,
          message: `Missing required field: ${n}`
        };
      }

      const val = Number(body.items[i][n]); //make it a number
      if (isNaN(val) || val < 0) { //if bad number
        return { //send error details
          isValid: false,
          field: `items[${i}].${n}`,
          message: `${n} must be a positive number.`
        };
      }
    }


  }

  return { //everything is good!
    isValid: true
  };
}

function getAllMeals(req, res) { //get all meals
  let meals = getMeals(); //grab a list of meals

  if (req.query.userId) { //if asking for a specific user
    if (!isValidNumericId(req.query.userId)) { //if bad user id
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid userId query parameter.", { //send error
        field: "userId",
        value: req.query.userId
      });
    }

    const userId = Number(req.query.userId); //make it a number
    const mealsForUser = []; //prepare list

    for (let i = 0; i < meals.length; i++) { //loop through meals
      const currentMeal = meals[i]; //grab a meal

      if (currentMeal.userId === userId) { //if it's user's meal
        mealsForUser.push(currentMeal); //add it
      }
    }

    meals = mealsForUser; //save filtered list
  }

  if (req.query.date) { //if asking for a specific date
    const mealsForDate = []; //prepare list

    for (let i = 0; i < meals.length; i++) { //loop through meals
      const currentMeal = meals[i]; //grab a meal

      if (currentMeal.mealDate === req.query.date) { //if it's the right day
        mealsForDate.push(currentMeal); //add it
      }
    }

    meals = mealsForDate; //save the filtered list
  }

  return successResponse(res, 200, meals); //send it all back
}

function getMealById(req, res) { //get one meal
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", { //send error
      field: "id",
      value: id
    });
  }

  const mealId = Number(id); //make it a number
  const meals = getMeals(); //get all meals
  let meal; //prepare to hold our meal

  for (let i = 0; i < meals.length; i++) { //loop through meals
    const currentMeal = meals[i]; //grab a meal

    if (currentMeal.mealId === mealId) { //if we found the wanted meal
      meal = currentMeal; //save it
      break; //stop looking
    }
  }

  if (!meal) { //if we didn't find the wanted meal
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", { //send error
      mealId: mealId
    });
  }

  return successResponse(res, 200, meal); //send it back
}

function createMeal(req, res) { //add a new meal
  const validation = validateMealBody(req.body); //check if data is good

  if (!validation.isValid) { //if bad data
    return errorResponse(res, 400, "VALIDATION_ERROR", validation.message, { //send error
      field: validation.field
    });
  }

  const now = new Date().toISOString(); //get current time
  const totals = calculateTotals(req.body.items); //do the math
  const mealItems = []; //prepare our list of items

  for (let i = 0; i < req.body.items.length; i++) { //loop through their items
    const item = req.body.items[i]; //grab this item

    mealItems.push({ //add it to our new list
      itemId: i + 1, //give it an id
      foodName: item.foodName, //its name
      confirmedPortionGrams: Number(item.confirmedPortionGrams), //its weight
      calories: Number(item.calories) || 0, //its calories
      protein: Number(item.protein) || 0, //its protein
      carbs: Number(item.carbs) || 0, //its carbs
      fat: Number(item.fat) || 0 //its fat
    });
  }

  const newMeal = { //build the whole meal
    mealId: getNextMealId(), //give it an id
    userId: Number(req.body.userId), //whose meal is this
    mealName: req.body.mealName, //what's it called
    mealDate: req.body.mealDate, //when was it
    imagePath: req.body.imagePath || null, //picture if they have one
    items: mealItems, //what's in it
    totalCalories: totals.totalCalories, //total cals
    totalProtein: totals.totalProtein, //total protein
    totalCarbs: totals.totalCarbs, //total carbs
    totalFat: totals.totalFat, //total fat
    createDate: now, //when added
    updateDate: now //when updated
  };

  const meals = getMeals(); //get all meals
  meals.push(newMeal); //add our new one

  return successResponse(res, 201, { //send back success
    mealId: newMeal.mealId //tell them the new id
  });
}

function updateMeal(req, res) { //change a meal
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", { //send error
      field: "id",
      value: id
    });
  }

  const validation = validateMealBody(req.body); //check if new data is good

  if (!validation.isValid) { //if bad data
    return errorResponse(res, 400, "VALIDATION_ERROR", validation.message, { //send error
      field: validation.field
    });
  }

  const mealId = Number(id); //make it a number
  const meals = getMeals(); //get all meals
  let mealIndex = -1; //prepare to find where it is

  for (let i = 0; i < meals.length; i++) { //loop through meals
    const currentMeal = meals[i]; //grab a meal

    if (currentMeal.mealId === mealId) { //if we found the wanted meal
      mealIndex = i; //save where it is
      break; //stop looking
    }
  }

  if (mealIndex === -1) { //if we didn't find it
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", { //send error
      mealId: mealId
    });
  }

  const totals = calculateTotals(req.body.items); //do the new math
  const mealItems = []; //prepare our new list of items

  for (let i = 0; i < req.body.items.length; i++) { //loop through their items
    const item = req.body.items[i]; //grab this item

    mealItems.push({ //add it
      itemId: i + 1, //give it an id
      foodName: item.foodName, //its name
      confirmedPortionGrams: Number(item.confirmedPortionGrams), //its weight
      calories: Number(item.calories) || 0, //its cals
      protein: Number(item.protein) || 0, //its protein
      carbs: Number(item.carbs) || 0, //its carbs
      fat: Number(item.fat) || 0 //its fat
    });
  }

  const existingMeal = meals[mealIndex]; //get the old meal
  const updatedMeal = {}; //prepare to update it

  for (const key in existingMeal) { //copy old stuff
    if (Object.prototype.hasOwnProperty.call(existingMeal, key)) { //make sure it's a real property
      updatedMeal[key] = existingMeal[key]; //copy it
    }
  }

  updatedMeal.userId = Number(req.body.userId); //update user
  updatedMeal.mealName = req.body.mealName; //update name
  updatedMeal.mealDate = req.body.mealDate; //update date
  updatedMeal.imagePath = req.body.imagePath || null; //update picture
  updatedMeal.items = mealItems; //update items
  updatedMeal.totalCalories = totals.totalCalories; //update cals
  updatedMeal.totalProtein = totals.totalProtein; //update protein
  updatedMeal.totalCarbs = totals.totalCarbs; //update carbs
  updatedMeal.totalFat = totals.totalFat; //update fat
  updatedMeal.updateDate = new Date().toISOString(); //update the timestamp

  meals[mealIndex] = updatedMeal; //save it back

  return successResponse(res, 200, { //send back success
    mealId: mealId //confirm what we updated
  });
}

function deleteMeal(req, res) { //remove a meal
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid meal id.", { //send error
      field: "id",
      value: id
    });
  }

  const mealId = Number(id); //make it a number
  const meals = getMeals(); //get all meals
  let mealExists = false; //assume we don't have it

  for (let i = 0; i < meals.length; i++) { //loop through meals
    const currentMeal = meals[i]; //grab this meal

    if (currentMeal.mealId === mealId) { //if found
      mealExists = true; //remember we found it
      break; //stop looking
    }
  }

  if (!mealExists) { //if we didn't find it
    return errorResponse(res, 404, "MEAL_NOT_FOUND", "Meal was not found.", { //send error
      mealId: mealId
    });
  }

  const filteredMeals = []; //prepare a new list without it

  for (let i = 0; i < meals.length; i++) { //loop through meals
    const currentMeal = meals[i]; //grab this meal

    if (currentMeal.mealId !== mealId) { //if it's not the one to delete
      filteredMeals.push(currentMeal); //keep it
    }
  }

  setMeals(filteredMeals); //save the new list

  return successResponse(res, 200, { //send back success
    mealId: mealId //confirm what we deleted
  });
}

module.exports = { //share our meal functions
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal
};
