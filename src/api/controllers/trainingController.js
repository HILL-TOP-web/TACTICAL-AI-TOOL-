const exercises = new Map();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

exports.getTrainingExercises = async (req, res, next) => {
  try {
    const data = Array.from(exercises.values());

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrainingExercise = async (req, res, next) => {
  try {
    const exercise = exercises.get(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: "Training exercise not found",
      });
    }

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTrainingExercise = async (req, res, next) => {
  try {
    const {
      name,
      description,
      objectives = [],
      difficulty = "medium",
      durationMinutes = 30,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "name is required",
      });
    }

    const id = generateId();

    const exercise = {
      id,
      name,
      description: description || "",
      objectives,
      difficulty,
      durationMinutes,
      status: "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    exercises.set(id, exercise);

    res.status(201).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTrainingExercise = async (req, res, next) => {
  try {
    const existing = exercises.get(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Training exercise not found",
      });
    }

    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    exercises.set(existing.id, updated);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTrainingExercise = async (req, res, next) => {
  try {
    if (!exercises.has(req.params.id)) {
      return res.status(404).json({
        success: false,
        error: "Training exercise not found",
      });
    }

    exercises.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Training exercise deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
