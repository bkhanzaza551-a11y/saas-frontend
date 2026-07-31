export const formatApiError = (error, fallback = "Something went wrong.") => {
  if (error?.name === "SyntaxError") {
    return error.message || fallback;
  }

  console.error("API Error details:", error);

  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (Array.isArray(data.issues) && data.issues.length) {
    return data.issues
      .map((issue) => issue?.field ? `${issue.field}: ${issue.message}` : issue?.message)
      .filter(Boolean)
      .join(" | ");
  }

  return data.message || error?.message || fallback;
};
