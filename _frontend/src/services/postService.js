import api from "./api";

// GET ALL POSTS
export const getPosts = async () => {

  const response = await api.get("/posts");

  return response.data;

};


// CREATE POST
export const createPost = async (postData) => {

  const response = await api.post(
    "/posts",
    postData
  );

  return response.data;

};


// GET MY POSTS
export const getMyPosts = async () => {

  const response = await api.get(
    "/posts/my"
  );

  return response.data;

};


// GET POST BY ID
export const getPostById = async (postId) => {

  const response = await api.get(
    `/posts/${postId}`
  );

  return response.data;

};


// UPDATE POST
export const updatePost = async (
  postId,
  postData
) => {

  const response = await api.put(
    `/posts/${postId}`,
    postData
  );

  return response.data;

};


// DELETE POST
export const deletePost = async (postId) => {

  await api.delete(
    `/posts/${postId}`
  );

};

export const createPostWithAttachment = async (postData, file) => {
  const formData = new FormData();
  formData.append("post", new Blob([JSON.stringify(postData)], { type: "application/json" }));
  if (file) {
    formData.append("file", file);
  }

  const response = await api.post("/posts", formData);
  return response.data;
};

export const updatePostWithAttachment = async (postId, postData, file) => {
  const formData = new FormData();
  formData.append("post", new Blob([JSON.stringify(postData)], { type: "application/json" }));
  if (file) {
    formData.append("file", file);
  }

  const response = await api.put(`/posts/${postId}`, formData);
  return response.data;
};