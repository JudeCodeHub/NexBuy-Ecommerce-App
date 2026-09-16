import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import imagekit from "@/configs/imagekit";
import authSeller from "@/middlewares/authSeller";
import { refillFeaturedSlots } from "@/lib/refillFeatured";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const brand = formData.get("brand") || null;
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");

    const images = formData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing product details" },
        { status: 400 }
      );
    }

    const imageUrl = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        });

        return imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "512" },
          ],
        });
      })
    );

    await prisma.product.create({
      data: {
        name,
        brand,
        description,
        mrp,
        price,
        category,
        images: imageUrl,
        storeId,
      },
    });

    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const productId = formData.get("productId");
    const name = formData.get("name");
    const brand = formData.get("brand") || null;
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const existingImages = JSON.parse(formData.get("existingImages") || "[]");

    if (!productId || !name || !description || !mrp || !price || !category) {
      return NextResponse.json(
        { error: "Missing product details" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const slotCount = 4;
    const imageUrl = [];

    for (let i = 0; i < slotCount; i++) {
      const newFile = formData.get(`image_${i}`);
      if (newFile && typeof newFile !== "string") {
        const buffer = Buffer.from(await newFile.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: newFile.name,
          folder: "products",
        });
        imageUrl.push(
          imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "512" },
            ],
          })
        );
      } else if (existingImages[i]) {
        imageUrl.push(existingImages[i]);
      }
    }

    if (imageUrl.length === 0) {
      return NextResponse.json(
        { error: "Please upload at least one image" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId, storeId },
      data: {
        name,
        brand,
        description,
        mrp,
        price,
        category,
        images: imageUrl,
      },
    });

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Missing details: productId" },
        { status: 400 }
      );
    }

    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    try {
      await prisma.product.delete({ where: { id: productId, storeId } });
    } catch (deleteError) {
      if (deleteError.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "This product has existing orders and can't be deleted. Set it out of stock instead.",
          },
          { status: 400 }
        );
      }
      throw deleteError;
    }

    if (product.featured) {
      await refillFeaturedSlots();
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
