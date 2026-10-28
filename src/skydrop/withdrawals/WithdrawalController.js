'use strict';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(
      handler(req, res, next)
    ).catch(next);
  };
}

function createWithdrawalController({
  service,
  methods
}) {
  return {
    methods: asyncHandler(async (req, res) => {
      res.json({
        success: true,
        methods: methods()
      });
    }),

    create: asyncHandler(async (req, res) => {
      const userId =
        req.user && (req.user.id || req.user._id);

      const withdrawal = await service.request(
        userId,
        req.body
      );

      res.status(202).json({
        success: true,
        withdrawal
      });
    }),

    get: asyncHandler(async (req, res) => {
      const userId =
        req.user && (req.user.id || req.user._id);

      const withdrawal = await service.get(
        userId,
        req.params.id
      );

      res.json({
        success: true,
        withdrawal
      });
    }),

    list: asyncHandler(async (req, res) => {
      const userId =
        req.user && (req.user.id || req.user._id);

      const withdrawals = await service.list(
        userId,
        req.query.limit
      );

      res.json({
        success: true,
        withdrawals
      });
    })
  };
}

module.exports = {
  createWithdrawalController
};
