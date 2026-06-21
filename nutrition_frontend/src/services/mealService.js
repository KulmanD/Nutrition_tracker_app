import { getAuthUser, request } from "./api";

function getCurrentUserId() {
  const user = getAuthUser();
  return user ? user.userId : 1;
}

export async function getDashboard() {
  const userId = getCurrentUserId();
  return request(`/dashboard/today?userId=${userId}`);
}

export async function getMeals() {
  const userId = getCurrentUserId();
  return request(`/meals?userId=${userId}`);
}

export async function createMeal(meal) {
  return request("/meals", {
    method: "POST",
    body: {
      ...meal,
      userId: getCurrentUserId()
    }
  });
}

export async function updateMeal(mealId, meal) {
  return request(`/meals/${mealId}`, {
    method: "PUT",
    body: {
      ...meal,
      userId: getCurrentUserId()
    }
  });
}

export async function deleteMeal(mealId) {
  return request(`/meals/${mealId}`, {
    method: "DELETE",
    headers: {
      "x-user-role": "admin"
    }
  });
}
