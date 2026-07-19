import { NextResponse } from "next/server";
import pool from "@/app/src/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      genres,
      streamingServices,
      contentTypes,
      excludedContentTypes,
      preferences,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    /*
      Only update a section when that section was actually
      included in the request body.
    */

    if (Array.isArray(genres)) {
      await pool.execute(
        "DELETE FROM user_genres WHERE user_id = ?",
        [userId]
      );

      for (const genre of genres) {
        await pool.execute(
          `
            INSERT INTO user_genres (
              user_id,
              genre_name
            )
            VALUES (?, ?)
          `,
          [userId, genre]
        );
      }
    }

    if (Array.isArray(streamingServices)) {
      await pool.execute(
        `
          DELETE FROM user_connected_services
          WHERE user_id = ?
        `,
        [userId]
      );

      for (const service of streamingServices) {
        await pool.execute(
          `
            INSERT INTO user_connected_services (
              user_id,
              service_name
            )
            VALUES (?, ?)
          `,
          [userId, service]
        );
      }
    }

    if (Array.isArray(contentTypes)) {
      await pool.execute(
        `
          DELETE FROM user_content_types
          WHERE user_id = ?
        `,
        [userId]
      );

      for (const type of contentTypes) {
        await pool.execute(
          `
            INSERT INTO user_content_types (
              user_id,
              content_type
            )
            VALUES (?, ?)
          `,
          [userId, type]
        );
      }
    }

    if (Array.isArray(preferences)) {
      await pool.execute(
        `
          DELETE FROM user_preferences
          WHERE user_id = ?
        `,
        [userId]
      );

      for (const preference of preferences) {
        await pool.execute(
          `
            INSERT INTO user_preferences (
              user_id,
              preference_name
            )
            VALUES (?, ?)
          `,
          [userId, preference]
        );
      }
    }

    if (Array.isArray(excludedContentTypes)) {
      await pool.execute(
        `
          DELETE FROM user_excluded_content_types
          WHERE user_id = ?
        `,
        [userId]
      );

      for (const typeName of excludedContentTypes) {
        if (typeName === "No Preference") {
          continue;
        }

        await pool.execute(
          `
            INSERT INTO user_excluded_content_types (
              user_id,
              content_type_id
            )
            SELECT ?, content_type_id
            FROM content_types
            WHERE type_name = ?
          `,
          [userId, typeName]
        );
      }
    }

    console.log("ONBOARDING / PREFERENCES UPDATED", {
      userId,
      genresIncluded: Array.isArray(genres),
      streamingServicesIncluded:
        Array.isArray(streamingServices),
      contentTypesIncluded:
        Array.isArray(contentTypes),
      excludedContentTypesIncluded:
        Array.isArray(excludedContentTypes),
      preferencesIncluded:
        Array.isArray(preferences),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Onboarding saved successfully",
    });
  } catch (error) {
    console.error("ONBOARDING ERROR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Server error",
      },
      { status: 500 }
    );
  }
}