import api from "./api";


// ----------------------------------------
// CREATE COMMENT
// ----------------------------------------

export const createComment = async (
  postId,
  content
) => {

  const response = await api.post(
    `/posts/${postId}/comments`,
    {
      content: content
    }
  );

  return response.data;
};


// ----------------------------------------
// GET COMMENTS OF A POST
// ----------------------------------------

export const getCommentsByPost = async (
  postId
) => {

  const response = await api.get(
    `/posts/${postId}/comments`
  );

  return response.data;
};


// ----------------------------------------
// UPDATE COMMENT
// ----------------------------------------

export const updateComment = async (
  commentId,
  content
) => {

  const response = await api.put(
    `/comments/${commentId}`,
    {
      content: content
    }
  );

  return response.data;
};


// ----------------------------------------
// DELETE COMMENT
// ----------------------------------------

export const deleteComment = async (
  commentId
) => {

  await api.delete(
    `/comments/${commentId}`
  );
};