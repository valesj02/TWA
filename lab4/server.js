const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = "products.json";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let products = loadProducts();

function loadProducts() {
   try {
       if (fs.existsSync(DATA_FILE)) {
           const data = fs.readFileSync(DATA_FILE, "utf8");
           return JSON.parse(data);
       } else {
           return [];
       }
   } catch (error) {
       console.error("Error loading products:", error);
       return [];
   }
}

function saveProducts() {
   try {
       fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
   } catch (error) {
       console.error("Error saving products:", error);
   }
}

function sanitizeProduct(product) {
   return {
       id: parseInt(product.id),
       name: product.name,
       price: parseFloat(product.price),
       weight: parseFloat(product.weight)
   };
}

app.get("/", (req, res) => {
   res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/products", (req, res) => {
   console.log("GET request: get products");
   res.json(products);
});

app.post("/products", (req, res) => {
   let product = sanitizeProduct(req.body);

   if (products.find(p => p.id === product.id)) {
       return res.status(400).json({ error: "Product with this ID already exists" });
   }

   products.push(product);
   saveProducts();

   console.log("POST request: Added product", product);
   res.status(201).json(product);
});

app.put("/products/:id", (req, res) => {
   const id = parseInt(req.params.id);
   const updatedData = sanitizeProduct(req.body);
   let productFound = false;

   products = products.map(p => {
       if (p.id === id) {
           productFound = true;
           return { ...p, ...updatedData, id: p.id };
       }
       return p;
   });

   if (productFound) {
       saveProducts();
       res.json({ message: `Product with id ${id} updated.` });
   } else {
       res.status(404).json({ error: "Product not found." });
   }
});

app.delete("/products/:id", (req, res) => {
   const id = parseInt(req.params.id);
   const initialLength = products.length;

   products = products.filter(p => p.id !== id);

   if (products.length < initialLength) {
       saveProducts();
       res.status(200).json({ message: `Product with id ${id} deleted.` });
   } else {
       res.status(404).json({ error: "Product not found." });
   }
});

app.listen(PORT, () => {
   console.log(`Server is running on http://localhost:${PORT}`);
});