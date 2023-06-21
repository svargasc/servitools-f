const express = require("express");
let mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

const upload = multer({ storage: storage });

const app = express();

app.use(cookieParser());

const timeEXp = 1000 * 60 * 60 * 24;
app.use(
  sessions({
    secret: "rfghf66a76ythggi87au7td",
    saveUninitialized: true,
    cookie: { maxAge: timeEXp },
    resave: false,
  })
);

app.post("/upload", upload.single("image"), function (req, res) {
  const image = req.file;
  const name = req.body.name;
  const details = req.body.details;
  const price = req.body.price;

  const sql = `INSERT INTO images (imgages, nombre, price, details) VALUES (?, ?, ?, ?)`;
  const values = [image.filename, name, price, details];

  pool.query(sql, values, function (err, result) {
    if (err) throw err;
    console.log("Image uploaded to the database");
    res.redirect("/upload");
  });
});

app.get("/upload", function (req, res) {
  pool.query("SELECT * FROM images", function (err, images) {
    if (err) throw err;

    if (images.length > 0) {
      let session = req.session;
      if (session.usuario) {
        return res.render("upload", {
          usuario: session.usuario,
          images: images,
        });
      }
      return res.render("upload", { usuario: undefined, images: images });
    }
    return res.render("upload", { usuario: undefined, images: images });
  });
});

app.get("/el/:id", (req, res) => {
  const id = req.params.id;
  pool.query("DELETE FROM images WHERE id = ?", [id], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect("/upload");
    }
  });
});

app.get("/formularioSubir", function (req, res) {
  pool.query("SELECT * FROM images", function (err, images) {
    if (err) throw err;

    if (images.length >= 0) {
      let session = req.session;
      if (session.usuario) {
        return res.render("formularioSubir", {
          usuario: session.usuario,
          images: images,
        });
      }
      return res.render("formularioSubir", {
        usuario: undefined,
        images: images,
      });
    }
  });
});



app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/public/", express.static("./public"));

const port = 10101;

const pool = mysql.createPool({
  connectionLimit: 100,
  host: "localhost",
  user: "root",
  password: "Apto1404",
  database: "servitools",
  debug: false,
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "servi.tools22@gmail.com",
    pass: "izmthaseotcktbwc",
  },
});

app.get("/seleccion", (req, res) => {
  let session = req.session;

  if (session.usuario) {
    return res.render("seleccion", { usuario: session.usuario });
  }
  return res.render("seleccion", { usuario: undefined });
});

app.get("/", (req, res) => {
  let session = req.session;

  if (session.usuario) {
    return res.render("index", { usuario: session.usuario });
  }
  return res.render("index", { usuario: undefined });
});

app.get("/registro", (req, res) => {
  res.render("registro");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/seleccion", (req, res) => {
  res.render("seleccion");
});
app.get("/productos", (req, res) => {
  res.render("productos");
});
app.get("/formularioSubir", (req, res) => {
  res.render("formularioSubir");
});



app.post("/registro", (req, res) => {
  let nombres = req.body.nombres;
  let apellidos = req.body.apellidos;
  let usuario = req.body.usuario;
  let contrasena = req.body.contrasena;
  let correo = req.body.correo;
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(contrasena, salt);
  pool.query(
    "INSERT INTO registro VALUES (?, ?, ?, ?, ?)",
    [nombres, apellidos, usuario, hash, correo],
    (error) => {
      if (error) throw error;
      res.redirect("/login");
      transporter
        .sendMail({
          from: "servi.tools22@gmail.com",
          to: `${correo}`,
          subject: "Confirmación de correo",
          html: '<h1>Gracias por registrarte!</h1> <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL14vd2g6r-QSkK6NRJ9Rdc2svG3auTMQuORMe9SxkCJf2xJRsSCPaVOZAnsYVCSny7VY&usqp=CAU">',
        })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  );
});

app.post("/login", (req, res) => {
  let usuario = req.body.usuario;
  let contrasena = req.body.contrasena;
  pool.query(
    "SELECT contraseña, usuario FROM registro WHERE usuario=?",
    [usuario],
    (error, data) => {
      if (error) throw error;

      if (data.length > 0) {
        let contrasenaEncriptada = data[0].contraseña;
        if (bcrypt.compareSync(contrasena, contrasenaEncriptada)) {
          let session = req.session;
          session.usuario = usuario;

          session.usuario = `${data[0].usuario}`;

          return res.redirect("/seleccion");
        }
        return res.render("login", { message: "USUARIO o CONTRASEÑA INCORRECTA - Por favor verifique que el usuario y la contraseña sean correctos." });
      }
      return res.render("login", { message: "USUARIO o CONTRASEÑA INCORRECTA - Por favor verifique que el usuario y la contraseña sean correctos." });
    }
  );
});

app.get("/detalles-productos/:id", (req, res) => {
  pool.query(
    "SELECT id, imgages, nombre, price, details FROM images WHERE id =?",
    [req.params.id],
    (error, data) => {
      if (error) throw error;
      console.log(data);
      if (data.length > 0) {
        let session = req.session;
        if (session.usuario) {
          return res.render("detalleProducto", {
            usuario: session.usuario,
            images: data,
          });
        }
        return res.render("detalleProducto", {
          usuario: undefined,
          images: data,
        });
      }
      return res.send(
        "A ocurrido un error al cargar el artículo, inténtelo mas tarde"
      );
    }
  );
});

app.get("/test-cookies", (req, res) => {
  session = req.session;
  if (session.usuario) {
    res.send(`Usted tiene una sesión en nuestro sistema con el usuario:
        ${session.usuario}`);
  } else res.send("Por favor inicie sesión para acceder a esta ruta protegida");
});

app.get("/logout", (req, res) => {
  let session = req.session;
  if (session.usuario) {
    req.session.destroy();
    return res.redirect("/");
  } else return res.send("Por favor inicie sesión");
});


app.get("/productosClientes", function (req, res) {
  pool.query("SELECT * FROM images", function (err, images) {
    if (err) throw err;

    if (images.length > 0) {
      let session = req.session;
      if (session.usuario) {
        return res.render("productosClientes", {
          usuario: session.usuario,
          images: images,
        });
      }
      return res.render("productosClientes", { usuario: undefined, images: images });
    }
    return res.redirect("./sinArticulos");
  });
  
});


//CRUD
app.get("/indexDos", function (req, res) {
  const id = req.query.id; // Obtener el valor del parámetro "id" de la solicitud

  pool.query("SELECT * FROM inventario", [id], (err, results) => {
    if (err) throw err;

    let session = req.session;
    if (session.usuario) {
      return res.render("indexDos", {
        usuario: session.usuario,
        results: results,
        nombre: results[0], // Pasar el objeto que contiene "nombre"
      });
    }
    return res.render("indexDos", {
      usuario: undefined,
      results: results,
      nombre: results[0], // Pasar el objeto que contiene "nombre"
    });
  });
});



app.get("/create", (req, res) => {
  res.render("create");
});

app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  pool.query("SELECT * FROM inventario WHERE id=?", [id], (error, results) => {
    if (error) {
      throw error;
    } else {
      res.render("edit.ejs", { nombre: results[0] });
    }
  });
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  pool.query("DELETE FROM inventario WHERE id = ?", [id], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect("/indexDos");
    }
  });
});

//GUARDAR un REGISTRO
app.post("/save", (req, res) => {
  const nombre = req.body.nombre;
  const stock = req.body.stock;
  pool.query(
    "INSERT INTO inventario SET ?",
    { nombre: nombre, stock: stock },
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        //console.log(results);
        res.redirect("/indexDos");
      }
    }
  );
});
//ACTUALIZAR un REGISTRO
app.post("/update", (req, res) => {
  const id = req.body.id;
  const nombre = req.body.nombre;
  const stock = req.body.stock;
  pool.query(
    "UPDATE inventario SET ? WHERE id = ?",
    [{ nombre: nombre, stock: stock }, id],
    (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.redirect("/indexDos");
      }
    }
  );
});




app.get("/carrito", function (req, res) {
  pool.query("SELECT * FROM carrito", function (err, carrito) {
    if (err) throw err;

    if (carrito.length > 0) {
      let session = req.session;
      if (session.usuario) {
        return res.render("carrito", {
          usuario: session.usuario,
          carrito: carrito,
        });
      }
      return res.render("carrito", { usuario: undefined, carrito: carrito });
    }
    return res.redirect("./carrito");
  });
});

// Ruta para agregar un producto al carrito
app.post('/carrito/agregar', (req, res) => {
  const { productoId } = req.body;
  const usuario = req.session.usuario; // Suponiendo que tienes autenticación de usuario

  // Obtener la información del producto
  const selectQuery = 'SELECT nombre, price FROM images WHERE id = ?';
  pool.query(selectQuery, [productoId], (err, rows) => {
    if (err) throw err;

    if (rows.length > 0) {
      const producto = rows[0];
      const nombreProducto = producto.nombre;
      const precioProducto = producto.price;

      // Verificar si el producto ya está en el carrito del usuario
      const selectCarritoQuery = 'SELECT id, cantidad FROM carrito WHERE producto_id = ?';
      pool.query(selectCarritoQuery, [productoId], (err, carritoRows) => {
        if (err) throw err;

        if (carritoRows.length > 0) {
          // El producto ya está en el carrito, aumentar la cantidad
          const carritoId = carritoRows[0].id;
          const cantidadActual = carritoRows[0].cantidad;
          const nuevaCantidad = cantidadActual + 1;

          const updateQuery = 'UPDATE carrito SET cantidad = ? WHERE id = ?';
          pool.query(updateQuery, [nuevaCantidad, carritoId], (err, result) => {
            if (err) throw err;
            res.redirect('/carrito');
          });
        } else {
          // El producto no está en el carrito, insertar nuevo registro
          const insertQuery = 'INSERT INTO carrito (usuario, producto_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, 1)';
          pool.query(insertQuery, [usuario, productoId, nombreProducto, precioProducto], (err, result) => {
            if (err) throw err;
            res.redirect('/carrito');
          });
        }
      });
    } else {
      res.status(404).send('Producto no encontrado');
    }
  });
});

// Ruta para mostrar el carrito
app.get('/carrito', (req, res) => {
  const usuario = req.session.usuario; // Suponiendo que tienes autenticación de usuario

  // Obtener los productos del carrito para el usuario actual
  const selectQuery = 'SELECT * FROM carrito WHERE usuario = ?';
  pool.query(selectQuery, [usuario], (err, rows) => {
    if (err) throw err;

    const productosCarrito = rows;

    // Renderizar la vista carrito.ejs y pasar los datos del carrito como variable
    res.render('carrito', { productosCarrito: productosCarrito });
  });
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});