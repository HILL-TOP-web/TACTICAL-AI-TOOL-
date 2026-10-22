'use strict';

const crypto = require('node:crypto');

const {
    validatePost,
    validateComment,
    validateInteraction,
    validatePagination,
    assertValid
} = require('./SocialValidator');

const {
    checkDatabaseEnvironment,
    checkMonnifyEnvironment
} = require('../database/DatabaseConnection');

class SocialManager {
    constructor(options = {}) {
        const {
            database,
            authorization = null,
            securityAudit = null
        } = options;

        if (!database || typeof database.query !== 'function') {
            throw new Error(
                'SocialManager requires a database connection.'
            );
        }

        this.database = database;
        this.authorization = authorization;
        this.securityAudit = securityAudit;
    }

    checkEnvironment() {
        const database = checkDatabaseEnvironment();

        return {
            configured: database.valid,
            missingVariables: database.missingVariables
        };
    }

    checkMonnifyConfiguration() {
        const monnify = checkMonnifyEnvironment();

        return {
            configured: monnify.valid,
            missingVariables: monnify.missingVariables
        };
    }

    async checkDatabaseConnection() {
        try {
            await this.database.query('SELECT 1');

            return {
                connected: true
            };
        } catch {
            return {
                connected: false,
                message: 'Database connectivity check failed.'
            };
        }
    }

    async createPost(input, actor) {
        const validation = validatePost(input);

        assertValid(validation);

        this.assertActor(actor, input.userId);

        await this.recordAudit({
            eventType: 'social_post_created',
            userId: input.userId
        });

        const postId = crypto.randomUUID();

        const result = await this.database.query(
            `
            INSERT INTO skydrop_social_posts (
                id,
                user_id,
                content,
                visibility,
                metadata,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
            `,
            [
                postId,
                input.userId,
                input.content.trim(),
                input.visibility || 'public',
                JSON.stringify(input.metadata || {})
            ]
        );

        return this.mapPost(result.rows[0]);
    }

    async getPost(postId, actor = null) {
        if (typeof postId !== 'string' || !postId.trim()) {
            throw new Error('A valid post ID is required.');
        }

        const result = await this.database.query(
            `
            SELECT
                p.*,
                u.display_name AS author_name
            FROM skydrop_social_posts p
            JOIN skydrop_users u ON u.id = p.user_id
            WHERE p.id = $1
              AND p.deleted_at IS NULL
            LIMIT 1
            `,
            [postId]
        );

        if (!result.rows.length) {
            return null;
        }

        const post = this.mapPost(result.rows[0]);

        if (post.visibility === 'private') {
            if (!actor || actor.id !== post.userId) {
                throw new Error(
                    'You are not authorized to view this post.'
                );
            }
        }

        if (post.visibility === 'followers') {
            /*
             * Followers-only access requires a follow-relationship
             * check. Deny access until that feature is implemented.
             */
            if (!actor || actor.id !== post.userId) {
                throw new Error(
                    'Followers-only post access is not configured.'
                );
            }
        }

        return post;
    }

    async listPublicPosts(options = {}) {
        const { limit, offset } = validatePagination(options);

        const result = await this.database.query(
            `
            SELECT
                p.*,
                u.display_name AS author_name
            FROM skydrop_social_posts p
            JOIN skydrop_users u ON u.id = p.user_id
            WHERE p.visibility = 'public'
              AND p.deleted_at IS NULL
              AND u.active = TRUE
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );

        return result.rows.map((row) => this.mapPost(row));
    }

    async addComment(input, actor) {
        const validation = validateComment(input);

        assertValid(validation);

        this.assertActor(actor, input.userId);

        const post = await this.getPost(input.postId, actor);

        if (!post) {
            throw new Error('Post not found.');
        }

        const commentId = crypto.randomUUID();

        const result = await this.database.query(
            `
            INSERT INTO skydrop_social_comments (
                id,
                post_id,
                user_id,
                content,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *
            `,
            [
                commentId,
                input.postId,
                input.userId,
                input.content.trim()
            ]
        );

        await this.recordAudit({
            eventType: 'social_comment_created',
            userId: input.userId
        });

        return result.rows[0];
    }

    async likePost(input, actor) {
        const interaction = {
            ...input,
            type: 'like'
        };

        const validation = validateInteraction(interaction);

        assertValid(validation);

        this.assertActor(actor, input.userId);

        const post = await this.getPost(input.postId, actor);

        if (!post) {
            throw new Error('Post not found.');
        }

        const result = await this.database.query(
            `
            INSERT INTO skydrop_social_likes (
                post_id,
                user_id,
                created_at
            )
            VALUES ($1, $2, NOW())
            ON CONFLICT (post_id, user_id) DO NOTHING
            RETURNING post_id, user_id
            `,
            [input.postId, input.userId]
        );

        return {
            liked: true,
            alreadyLiked: result.rows.length === 0
        };
    }

    async unlikePost(input, actor) {
        const interaction = {
            ...input,
            type: 'unlike'
        };

        const validation = validateInteraction(interaction);

        assertValid(validation);

        this.assertActor(actor, input.userId);

        const result = await this.database.query(
            `
            DELETE FROM skydrop_social_likes
            WHERE post_id = $1
              AND user_id = $2
            RETURNING post_id
            `,
            [input.postId, input.userId]
        );

        return {
            liked: false,
            removed: result.rows.length > 0
        };
    }

    async sharePost(input, actor) {
        const interaction = {
            ...input,
            type: 'share'
        };

        const validation = validateInteraction(interaction);

        assertValid(validation);

        this.assertActor(actor, input.userId);

        const post = await this.getPost(input.postId, actor);

        if (!post) {
            throw new Error('Post not found.');
        }

        const shareId = crypto.randomUUID();

        const result = await this.database.query(
            `
            INSERT INTO skydrop_social_shares (
                id,
                post_id,
                user_id,
                created_at
            )
            VALUES ($1, $2, $3, NOW())
            RETURNING *
            `,
            [
                shareId,
                input.postId,
                input.userId
            ]
        );

        return result.rows[0];
    }

    async deletePost(postId, actor) {
        if (!actor || !actor.id) {
            throw new Error('Authentication is required.');
        }

        const result = await this.database.query(
            `
            UPDATE skydrop_social_posts
            SET
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND deleted_at IS NULL
            RETURNING id
            `,
            [postId, actor.id]
        );

        if (!result.rows.length) {
            throw new Error(
                'Post not found or you cannot delete it.'
            );
        }

        await this.recordAudit({
            eventType: 'social_post_deleted',
            userId: actor.id
        });

        return {
            deleted: true,
            postId
        };
    }

    assertActor(actor, requestedUserId) {
        if (!actor || typeof actor.id !== 'string' || !actor.id) {
            throw new Error('Authentication is required.');
        }

        if (actor.active === false || actor.disabled === true) {
            throw new Error('This account is not active.');
        }

        if (actor.id !== requestedUserId) {
            throw new Error(
                'The authenticated user cannot act for another user.'
            );
        }

        if (this.authorization) {
            this.authorization.requireUserIdentity(actor);
        }
    }

    async recordAudit(event) {
        if (!this.securityAudit) {
            return null;
        }

        return this.securityAudit.record({
            eventType: event.eventType,
            userId: event.userId,
            source: 'social_manager',
            outcome: 'success'
        });
    }

    mapPost(row) {
        return {
            id: row.id,
            userId: row.user_id,
            authorName: row.author_name || null,
            content: row.content,
            visibility: row.visibility,
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

module.exports = SocialManager;
