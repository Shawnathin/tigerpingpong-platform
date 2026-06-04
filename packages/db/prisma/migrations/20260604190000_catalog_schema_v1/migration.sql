-- CreateEnum
CREATE TYPE "product_kind" AS ENUM ('table', 'paddle', 'ball', 'net', 'cover', 'accessory', 'replacement_part');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "purchase_mode" AS ENUM ('online_checkout_candidate', 'online_checkout', 'quote_required', 'dealer_contact', 'needs_manual_review', 'deferred_from_v1', 'coming_soon', 'disabled');

-- CreateEnum
CREATE TYPE "source_review_status" AS ENUM ('needs_review', 'approved_for_schema_planning', 'deferred');

-- CreateEnum
CREATE TYPE "media_role" AS ENUM ('primary', 'gallery', 'detail', 'lifestyle', 'variant', 'source_reference');

-- CreateEnum
CREATE TYPE "media_review_status" AS ENUM ('needs_review', 'approved', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "media_source_provider" AS ENUM ('bigcommerce', 'cloudinary', 'manual', 'supplier', 'unknown');

-- CreateEnum
CREATE TYPE "quote_request_status" AS ENUM ('new', 'reviewing', 'contacted', 'closed');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('draft', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "redirect_status" AS ENUM ('draft', 'approved', 'deferred');

-- CreateEnum
CREATE TYPE "relationship_type" AS ENUM ('related', 'upsell', 'cross_sell', 'accessory', 'replacement_part', 'compatible_with', 'similar', 'required_part');

-- CreateEnum
CREATE TYPE "review_severity" AS ENUM ('info', 'medium', 'high', 'blocker');

-- CreateEnum
CREATE TYPE "review_resolution_status" AS ENUM ('open', 'resolved', 'deferred');

-- CreateTable
CREATE TABLE "platform_metadata" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "v1_public_navigation" BOOLEAN NOT NULL DEFAULT false,
    "v1_checkout_scope" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "legacy_path" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_families" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "primary_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "source_evidence" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "primary_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source_url" TEXT,
    "legacy_path" TEXT,
    "sku" TEXT,
    "product_kind" "product_kind" NOT NULL,
    "status" "product_status" NOT NULL DEFAULT 'draft',
    "v1_public_navigation" BOOLEAN NOT NULL DEFAULT false,
    "v1_checkout_scope" BOOLEAN NOT NULL DEFAULT false,
    "purchase_mode" "purchase_mode" NOT NULL DEFAULT 'needs_manual_review',
    "price_cents" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "shipping_review_required" BOOLEAN NOT NULL DEFAULT false,
    "shipping_summary" TEXT,
    "lead_time_text" TEXT,
    "short_description" TEXT,
    "description" TEXT,
    "source_review_status" "source_review_status" NOT NULL DEFAULT 'needs_review',
    "import_review_status" "source_review_status" NOT NULL DEFAULT 'needs_review',
    "notes" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "price_cents" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "purchase_mode_override" "purchase_mode",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option_values" (
    "product_variant_id" TEXT NOT NULL,
    "product_option_value_id" TEXT NOT NULL,

    CONSTRAINT "product_variant_option_values_pkey" PRIMARY KEY ("product_variant_id","product_option_value_id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL,
    "media_key" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "role" "media_role" NOT NULL DEFAULT 'gallery',
    "cloudinary_asset_id" TEXT,
    "cloudinary_public_id" TEXT,
    "cloudinary_version" TEXT,
    "cloudinary_secure_url" TEXT,
    "cloudinary_resource_type" TEXT,
    "cloudinary_format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" BIGINT,
    "source_url" TEXT,
    "source_provider" "media_source_provider" NOT NULL DEFAULT 'unknown',
    "source_checksum" TEXT,
    "alt_text" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "review_status" "media_review_status" NOT NULL DEFAULT 'needs_review',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_content_sections" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "section_type" TEXT NOT NULL,
    "eyebrow" TEXT,
    "heading" TEXT,
    "body" TEXT,
    "media_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_content_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_spec_groups" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_spec_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "spec_group_id" TEXT,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "comparison_key" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "is_comparison_attribute" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_relationships" (
    "id" TEXT NOT NULL,
    "source_product_id" TEXT NOT NULL,
    "target_product_id" TEXT NOT NULL,
    "relationship_type" "relationship_type" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "status" "quote_request_status" NOT NULL DEFAULT 'new',
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "postal_code" TEXT,
    "preferred_contact_method" TEXT,
    "message" TEXT,
    "source_page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_request_items" (
    "id" TEXT NOT NULL,
    "quote_request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'draft',
    "customer_email" TEXT,
    "customer_name" TEXT,
    "subtotal_cents" INTEGER NOT NULL DEFAULT 0,
    "shipping_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
    "external_payment_reference" TEXT,
    "contains_table_freight_item" BOOLEAN NOT NULL DEFAULT false,
    "shipping_review_required" BOOLEAN NOT NULL DEFAULT false,
    "freight_acknowledged_at" TIMESTAMP(3),
    "damage_policy_acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "sku_snapshot" TEXT,
    "name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_cents" INTEGER NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "legacy_path" TEXT NOT NULL,
    "new_path_candidate" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_key" TEXT,
    "redirect_status" "redirect_status" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_review_flags" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_key" TEXT NOT NULL,
    "source_url" TEXT,
    "flag" TEXT NOT NULL,
    "severity" "review_severity" NOT NULL DEFAULT 'info',
    "resolution_owner" TEXT,
    "resolution_status" "review_resolution_status" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_review_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_metadata_key_key" ON "platform_metadata"("key");

-- CreateIndex
CREATE UNIQUE INDEX "brands_key_key" ON "brands"("key");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_key_key" ON "categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_source_url_idx" ON "categories"("source_url");

-- CreateIndex
CREATE INDEX "categories_legacy_path_idx" ON "categories"("legacy_path");

-- CreateIndex
CREATE INDEX "categories_v1_public_navigation_idx" ON "categories"("v1_public_navigation");

-- CreateIndex
CREATE INDEX "categories_v1_checkout_scope_idx" ON "categories"("v1_checkout_scope");

-- CreateIndex
CREATE UNIQUE INDEX "product_families_key_key" ON "product_families"("key");

-- CreateIndex
CREATE UNIQUE INDEX "product_families_slug_key" ON "product_families"("slug");

-- CreateIndex
CREATE INDEX "product_families_brand_id_idx" ON "product_families"("brand_id");

-- CreateIndex
CREATE INDEX "product_families_primary_category_id_idx" ON "product_families"("primary_category_id");

-- CreateIndex
CREATE INDEX "product_families_is_public_idx" ON "product_families"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "products_key_key" ON "products"("key");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_family_id_idx" ON "products"("family_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_primary_category_id_idx" ON "products"("primary_category_id");

-- CreateIndex
CREATE INDEX "products_source_url_idx" ON "products"("source_url");

-- CreateIndex
CREATE INDEX "products_legacy_path_idx" ON "products"("legacy_path");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_product_kind_idx" ON "products"("product_kind");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_purchase_mode_idx" ON "products"("purchase_mode");

-- CreateIndex
CREATE INDEX "products_v1_public_navigation_idx" ON "products"("v1_public_navigation");

-- CreateIndex
CREATE INDEX "products_v1_checkout_scope_idx" ON "products"("v1_checkout_scope");

-- CreateIndex
CREATE INDEX "product_options_product_id_idx" ON "product_options"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_product_id_name_key" ON "product_options"("product_id", "name");

-- CreateIndex
CREATE INDEX "product_option_values_option_id_idx" ON "product_option_values"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_option_id_value_key" ON "product_option_values"("option_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_key_key" ON "product_variants"("key");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_source_url_idx" ON "product_variants"("source_url");

-- CreateIndex
CREATE INDEX "product_variants_purchase_mode_override_idx" ON "product_variants"("purchase_mode_override");

-- CreateIndex
CREATE INDEX "product_variant_option_values_product_option_value_id_idx" ON "product_variant_option_values"("product_option_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_media_key_key" ON "product_media"("media_key");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_cloudinary_asset_id_key" ON "product_media"("cloudinary_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_cloudinary_public_id_key" ON "product_media"("cloudinary_public_id");

-- CreateIndex
CREATE INDEX "product_media_product_id_idx" ON "product_media"("product_id");

-- CreateIndex
CREATE INDEX "product_media_variant_id_idx" ON "product_media"("variant_id");

-- CreateIndex
CREATE INDEX "product_media_role_idx" ON "product_media"("role");

-- CreateIndex
CREATE INDEX "product_media_source_url_idx" ON "product_media"("source_url");

-- CreateIndex
CREATE INDEX "product_media_source_checksum_idx" ON "product_media"("source_checksum");

-- CreateIndex
CREATE INDEX "product_media_review_status_idx" ON "product_media"("review_status");

-- CreateIndex
CREATE INDEX "product_media_is_public_idx" ON "product_media"("is_public");

-- CreateIndex
CREATE INDEX "product_media_is_active_idx" ON "product_media"("is_active");

-- CreateIndex
CREATE INDEX "product_content_sections_product_id_idx" ON "product_content_sections"("product_id");

-- CreateIndex
CREATE INDEX "product_content_sections_media_id_idx" ON "product_content_sections"("media_id");

-- CreateIndex
CREATE INDEX "product_content_sections_section_type_idx" ON "product_content_sections"("section_type");

-- CreateIndex
CREATE INDEX "product_spec_groups_product_id_idx" ON "product_spec_groups"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_spec_groups_product_id_name_key" ON "product_spec_groups"("product_id", "name");

-- CreateIndex
CREATE INDEX "product_specs_product_id_idx" ON "product_specs"("product_id");

-- CreateIndex
CREATE INDEX "product_specs_spec_group_id_idx" ON "product_specs"("spec_group_id");

-- CreateIndex
CREATE INDEX "product_specs_comparison_key_idx" ON "product_specs"("comparison_key");

-- CreateIndex
CREATE INDEX "product_specs_is_highlighted_idx" ON "product_specs"("is_highlighted");

-- CreateIndex
CREATE INDEX "product_specs_is_comparison_attribute_idx" ON "product_specs"("is_comparison_attribute");

-- CreateIndex
CREATE INDEX "product_relationships_source_product_id_idx" ON "product_relationships"("source_product_id");

-- CreateIndex
CREATE INDEX "product_relationships_target_product_id_idx" ON "product_relationships"("target_product_id");

-- CreateIndex
CREATE INDEX "product_relationships_relationship_type_idx" ON "product_relationships"("relationship_type");

-- CreateIndex
CREATE INDEX "product_relationships_is_public_idx" ON "product_relationships"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "product_relationships_source_product_id_target_product_id_r_key" ON "product_relationships"("source_product_id", "target_product_id", "relationship_type");

-- CreateIndex
CREATE INDEX "quote_requests_status_idx" ON "quote_requests"("status");

-- CreateIndex
CREATE INDEX "quote_requests_customer_email_idx" ON "quote_requests"("customer_email");

-- CreateIndex
CREATE INDEX "quote_request_items_quote_request_id_idx" ON "quote_request_items"("quote_request_id");

-- CreateIndex
CREATE INDEX "quote_request_items_product_id_idx" ON "quote_request_items"("product_id");

-- CreateIndex
CREATE INDEX "quote_request_items_variant_id_idx" ON "quote_request_items"("variant_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_legacy_path_key" ON "redirects"("legacy_path");

-- CreateIndex
CREATE INDEX "redirects_entity_type_entity_key_idx" ON "redirects"("entity_type", "entity_key");

-- CreateIndex
CREATE INDEX "redirects_redirect_status_idx" ON "redirects"("redirect_status");

-- CreateIndex
CREATE INDEX "import_review_flags_entity_type_entity_key_idx" ON "import_review_flags"("entity_type", "entity_key");

-- CreateIndex
CREATE INDEX "import_review_flags_source_url_idx" ON "import_review_flags"("source_url");

-- CreateIndex
CREATE INDEX "import_review_flags_flag_idx" ON "import_review_flags"("flag");

-- CreateIndex
CREATE INDEX "import_review_flags_severity_idx" ON "import_review_flags"("severity");

-- CreateIndex
CREATE INDEX "import_review_flags_resolution_status_idx" ON "import_review_flags"("resolution_status");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_product_option_value_id_fkey" FOREIGN KEY ("product_option_value_id") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_content_sections" ADD CONSTRAINT "product_content_sections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_content_sections" ADD CONSTRAINT "product_content_sections_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "product_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_groups" ADD CONSTRAINT "product_spec_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_spec_group_id_fkey" FOREIGN KEY ("spec_group_id") REFERENCES "product_spec_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_source_product_id_fkey" FOREIGN KEY ("source_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_relationships" ADD CONSTRAINT "product_relationships_target_product_id_fkey" FOREIGN KEY ("target_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request_items" ADD CONSTRAINT "quote_request_items_quote_request_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request_items" ADD CONSTRAINT "quote_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_request_items" ADD CONSTRAINT "quote_request_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

