import prisma from "../src/lib/prisma.js";

async function seed() {
  await prisma.$transaction(async (tx) => {
    for (let i = 1; i <= 12; i++) {
      const id = `seed-product-${i}`;

      await tx.product.upsert({
        where: { id },
        update: {},
        create: {
          id,
          name: `샘플 상품 ${i}`,
          description: `샘플 상품 ${i}의 설명입니다.`,
          price: i * 1000,
          tags: ["샘플"],
        },
      });
    }

    for (let i = 1; i <= 5; i++) {
      const id = `seed-article-${i}`;

      await tx.article.upsert({
        where: { id },
        update: {},
        create: {
          id,
          title: `샘플 게시글 ${i}`,
          content: `샘플 게시글 ${i}의 내용입니다.`,
        },
      });
    }

    for (let i = 1; i <= 5; i++) {
      await tx.productComment.upsert({
        where: { id: `seed-product-comment-${i}` },
        update: {},
        create: {
          id: `seed-product-comment-${i}`,
          content: `상품 샘플 댓글 ${i}`,
          productId: "seed-product-1",
        },
      });

      await tx.articleComment.upsert({
        where: { id: `seed-article-comment-${i}` },
        update: {},
        create: {
          id: `seed-article-comment-${i}`,
          content: `게시글 샘플 댓글 ${i}`,
          articleId: "seed-article-1",
        },
      });
    }
  });

  console.log("시딩 완료: 상품 12개, 게시글 5개, 각 댓글 5개 준비");
}

try {
  await seed();
} catch (error) {
  console.error("시딩 실패:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}