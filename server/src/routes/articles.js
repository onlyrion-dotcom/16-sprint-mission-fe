import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

// 게시글 등록
router.post("/", async (req, res) => {
  try {
    if (
      req.body === null ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "요청 본문은 JSON 객체로 보내주세요.",
      });
    }

    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "제목과 내용은 비어 있지 않은 문자열로 입력해주세요.",
      });
    }

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        content: content.trim(),
      },
    });

    return res.status(201).json(article);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "게시글을 등록하는 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 목록 조회
router.get("/", async (req, res) => {
  try {
    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.limit ?? 10);
    const orderBy = req.query.orderBy ?? "recent";
    const keyword = String(req.query.keyword ?? "").trim();

    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "offset과 limit을 올바르게 입력해주세요.",
      });
    }

    if (orderBy !== "recent") {
      return res.status(400).json({
        message: "orderBy는 recent만 사용할 수 있습니다.",
      });
    }

    const searchKeyword = keyword.replace(/[\\%_]/g, "\\$&");

    const where = keyword
      ? {
          OR: [
            {
              title: {
                contains: searchKeyword,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: searchKeyword,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return res.status(200).json({
      list: articles,
      totalCount,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "게시글 목록을 조회하는 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 상세 조회
router.get("/:id", async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    if (!article) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    return res.status(200).json(article);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "게시글을 조회하는 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 수정
router.patch("/:id", async (req, res) => {
  try {
    if (
      req.body === null ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "요청 본문은 JSON 객체로 보내주세요.",
      });
    }

    const allowedFields = ["title", "content"];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "수정할 제목이나 내용을 입력해주세요.",
      });
    }

    if (
      Object.values(updates).some(
        (value) => typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        message: "제목과 내용은 비어 있지 않은 문자열로 입력해주세요.",
      });
    }

    const data = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        value.trim(),
      ])
    );

    const article = await prisma.article.update({
      where: {
        id: req.params.id,
      },
      data,
    });

    return res.status(200).json(article);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "게시글을 수정하는 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 삭제
router.delete("/:id", async (req, res) => {
  try {
    const article = await prisma.article.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(200).json({
      id: article.id,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "게시글을 삭제하는 중 오류가 발생했습니다.",
    });
  }
});

// 게시글 댓글 등록
router.post("/:id/comments", async (req, res) => {
  try {
    if (
      req.body === null ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "요청 본문은 JSON 객체로 보내주세요.",
      });
    }

    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "댓글 내용은 비어 있지 않은 문자열로 입력해주세요.",
      });
    }

    const comment = await prisma.articleComment.create({
      data: {
        content: content.trim(),
        articleId: req.params.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "댓글을 등록하는 중 오류가 발생했습니다.",
    });
  }
});


router.patch("/:id/comments/:commentId", async (req, res) => {
  try {
    if (
      req.body === null ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: "요청 본문은 JSON 객체로 보내주세요.",
      });
    }

    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "댓글 내용은 비어 있지 않은 문자열로 입력해주세요.",
      });
    }

    const comment = await prisma.articleComment.update({
      where: {
        id: req.params.commentId,
        articleId: req.params.id,
      },
      data: {
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return res.status(200).json(comment);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "해당 게시글의 댓글을 찾을 수 없습니다.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "댓글을 수정하는 중 오류가 발생했습니다.",
    });
  }
});

router.delete("/:id/comments/:commentId", async (req, res) => {
  try {
    const comment = await prisma.articleComment.delete({
      where: {
        id: req.params.commentId,
        articleId: req.params.id,
      },
    });

    return res.status(200).json({
      id: comment.id,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "해당 게시글의 댓글을 찾을 수 없습니다.",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "댓글을 삭제하는 중 오류가 발생했습니다.",
    });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 10);
    const cursor = req.query.cursor;

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      (cursor !== undefined &&
        (typeof cursor !== "string" || !cursor.trim()))
    ) {
      return res.status(400).json({
        message: "limit과 cursor를 올바르게 입력해주세요.",
      });
    }

    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!article) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    if (cursor !== undefined) {
      const cursorComment = await prisma.articleComment.findFirst({
        where: {
          id: cursor,
          articleId: req.params.id,
        },
        select: { id: true },
      });

      if (!cursorComment) {
        return res.status(400).json({
          message: "해당 게시글의 유효한 댓글 cursor를 입력해주세요.",
        });
      }
    }

    const comments = await prisma.articleComment.findMany({
      where: {
        articleId: req.params.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor !== undefined
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasNext = comments.length > limit;
    const list = comments.slice(0, limit);
    const nextCursor = hasNext ? list[list.length - 1].id : null;

    return res.status(200).json({
      list,
      nextCursor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "댓글 목록을 조회하는 중 오류가 발생했습니다.",
    });
  }
});

export default router;