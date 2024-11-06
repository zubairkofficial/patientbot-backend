const getUser = (req, res) => {
    const userId = req.params.id;
    // Mock response
    res.json({ id: userId, name: "User Name" });
};

export { getUser }; // Use export statement instead of module.exports