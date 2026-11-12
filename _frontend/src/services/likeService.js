import api from "./api";

// LIKE POST
export const likePost = async (postId) => {
  const response = await api.post(
    `/posts/${postId}/like`
  );

  return response.data;
};

// UNLIKE POST
export const unlikePost = async (postId) => {
  await api.delete(
    `/posts/${postId}/like`
  );
};

// GET LIKE COUNT
export const getLikeCount = async (postId) => {
  const response = await api.get(
    `/posts/${postId}/likes/count`
  );

  return response.data;
};

// CHECK WHETHER CURRENT USER LIKED
export const hasLiked = async (postId) => {
  const response = await api.get(
    `/posts/${postId}/liked`
  );

  return response.data;
};