const situations = new Map();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

exports.getSituations = async (req, res, next) => {
  try {
    const data = Array.from(situations.values());

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSituation = async (req, res, next) => {
  try {
    const situation = situations.get(req.params.id);

    if (!situation) {
      return res.status(404).json({
        success: false,
        error: "Situation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: situation,
    });
  } catch (error) {
    next(error);
  }
};

exports.createSituation = async (req, res, next) => {
  try {
    const { name, description, entities = [], events = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      });
    }

    const id = generateId();

    const situation = {
      id,
      name,
      description: description || "",
      entities,
      events,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    situations.set(id, situation);

    res.status(201).json({
      success: true,
      data: situation,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSituation = async (req, res, next) => {
  try {
    const existing = situations.get(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Situation not found",
      });
    }

    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    situations.set(existing.id, updated);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSituation = async (req, res, next) => {
  try {
    const exists = situations.has(req.params.id);

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: "Situation not found",
      });
    }

    situations.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Situation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
