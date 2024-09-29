# Api-Template-With-Auth-For-Vercel 🔐

<div align="center">
  <code>Built With 👇🏾</code>
  <br />
  <br />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="" />
</div>

A robust and versatile REST API template with the setup of Authentication and User Management to streamline the process of creating REST APIs using Express.js.

It eliminates the need to write authentication code, saving you valuable time and effort. This template serves as an excellent starting point for any API requiring authentication, providing a secure and efficient foundation.

- 🌟 Specially **designed to deploy on** [Vercel](https://vercel.com)

> [IMPORTANT]
> In this api every single file contains multiple components
instead of being modularized because this API
is designed to be deployed on Vercel. Vercel 
doesn't support more than 12 serverless 
functions, so to keep the JavaScript files under 12,
I designed the API code this way.


### 🔴 Unveiling the Journey of Building This Api-Template
> [!Note]
> I developed this REST API to simplify the creation of APIs that require authentication. By using this template, developers can avoid writing authentication code, allowing them to focus on other essential aspects of their projects. This solution provides a comprehensive and efficient approach to creating REST APIs with user authentication.

### Project Created at
- 🗓 *September 2024*

### Technologies Used ⚒️
- Node.js
- Express.js 
- MongoDB
- Express-Validator
- Node Mailer

### 🤓 Fun Fact! How I Made This project || Screenshots

<details>
  <summary>
    Read Here
  </summary>

### `🌟 This project was created using an Android phone`

### 📱 Coding with Android is Amazing!

If you think you need a PC to start coding, think again! With just an Android phone, you can dive into the world of web and app development. Here’s a showcase of a project created entirely on an Android phone using Acode, Restler, and Termux.

### 🔧 Tools Used:
- **Acode**: A powerful code editor with features similar to VS Code, such as auto code completion, keyboard shortcuts, and theme customization.
- **Restler**: A REST API client for testing and debugging APIs similar to Postman.
- **Termux**: A terminal emulator for Android that allows you to run Linux commands and scripts.
- **Hacker's Keyboard**: A pc like Keyboard for Android that allows you to use commands like: Ctrl, Alt, F1, F2, (Up, Down, Right, Left Arrow) etc.

### 🖼️ Screenshots:

1. **Project in Acode Editor:**

<div align="center">
  <img width="48%" src="images/acode-1.png" alt="Acode Editor" />
  <img width="48%" src="images/acode-2.png" alt="Acode Editor" />
</div> 

2. **Running the Project in Termux:**

<div align="center">
  <img width="48%" src="images/termux-1.png" alt="Termux" />
  <img width="48%" src="images/termux-2.png" alt="Termux" />
</div> 

3. **Testing APIs with Restler:**

<div align="center">
  <img width="30%" src="images/restler-1.png" alt="Restler" />
  <img width="30%" src="images/restler-2.png" alt="Restler" />
  <img width="30%" src="images/restler-3.png" alt="Restler" />
</div> 

### 🚀 Why Coding with Android is Amazing:
- **Portability**: Code anytime, anywhere with just your phone.
- **Convenience**: No need to carry a laptop; everything you need is in your pocket.
- **Efficiency**: Get a lot done with minimal resources.

> [!Note]
> With the right tools, learning and developing on an Android phone is not only possible but also an incredibly rewarding experience. Start your coding journey now!

---

</details>

## Features

- 🔐 **Authentication**: Secure user authentication and authorization.
- 📊 **Pagination & Sorting**: Efficiently manage large data sets with pagination and sorting features.
- 🌐 **Partial Response**: Retrieve only the necessary data for optimized performance.
- 🔒 **Secure with JWT**: JSON Web Tokens for secure authentication.
- ✅ **Validation with Express-Validator**: Ensure data integrity and correctness.
- 🚦 **Rate Limit**: Protect against abuse and ensure fair usage.
- 📧 **Account Confirmation**: Features for confirming user accounts before login.
- 🔑 **Reset Password**: Allow users to securely reset their passwords.
- 📧 **Change Email**: Enable users to change their email with new email.
- 🔐 **Change Password**: Allow users to securely change their passwords.
- ️🐞 **Graceful Error Handling**: Consistent and informative error responses.
- 📃 **Documentation**: A comprehensive documentation with `swagger`.
- 🚀 **And Much More**

> [!IMPORTANT]
> Please note that the **API Documentation** is currently a work in progress. Proper API documentation using Swagger is not yet complete. This means some endpoints may not be fully documented. 

> [!NOTE]
> *Im working on completing this documentation to provide a more comprehensive guide for using This Api Template.*

### Live Demo 🎉
> The API has not yet been deployed.

---

## Setup Guide

### `Prerequisites`

Ensure you have the following installed on your machine:

- Node.js
- Git

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/fazle-rabbi-dev/Api-Template-With-Auth
    cd Api-Template-With-Auth
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up environment variables**:

    Create a `.env` file in the root directory and add your configuration settings. For example:
    ```env
    PORT=3000

    MONGODB_URI=
    JWT_SECRET=
    
    ACCESS_TOKEN_SECRET=
    REFRESH_TOKEN_SECRET=
    
    ACCESS_TOKEN_EXPIRY="1d"
    REFRESH_TOKEN_EXPIRY="10d"
    
    GMAIL_USERNAME=
    GMAIL_PASSWORD=<Write your app password that you can get by enabling two factor auth in your gmail account>
    
    ENVIRONMENT=dev <For Seeding Purpose>

    ```
4. **Customize Configuration**: Modify the constants in `/src/index.js` to fit your specific needs.


4. **Run the server**:
    ```sh
    npm run dev
    ```

---

### Usage

- 🚀 The server will start on `http://localhost:3000`. 
- Use a tool like Postman to interact with the API endpoints.
- **API base URL:** `http://localhost:3000/api/`
  - **AUTH Base URL:** `base_url/auth`
  - **USERS Base URL:** `base_url/users`
  - **SEEDING Base URL:** `base_url/seed`

- **📘 API Documentation:**
  - `http://localhost:3000/api-docs`
- **⚡ API Health Check:**
  - `http://localhost:3000/health`

## Contributing 🫱🏻‍🫲🏼

Contributions are welcome! 🎉 If you would like to contribute to **This Api-Template**, please follow these steps:

1. **Fork the repository**: Click the "Fork" button at the top right of this page to create a copy of this repository under your GitHub account.
2. **Clone your fork**: Clone your forked repository to your local machine.
   ```sh
   git clone https://github.com/your-username/Api-Template-With-Auth
   ```
3. **Create a branch**: Create a new branch for your feature or bugfix.
   ```sh
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**: Make your changes to the codebase.
5. **Commit your changes**: Commit your changes with a clear and concise commit message.
   ```sh
   git commit -m "Add your commit message here"
   ```
6. **Push to your branch**: Push your changes to your forked repository.
   ```sh
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**: Go to the original repository on GitHub and create a pull request from your forked repository. Provide a clear description of your changes and the reasons for them.

Your contributions will help make **This Template** even better. Thank you for your support! 🚀

## License

This project is licensed under the MIT License.

---

Thank you for using **This Api-Template**! I hope it accelerates your eCommerce development and makes your life easier. Happy coding! 🚀


### 📬 Connect with me
> Let's connect! Reach out for collaborations, projects, or just a friendly chat.

<a target="_blank" href="https://linkedin.com/in/fazlerabbidev" ><img align="center" src="https://cdn.jsdelivr.net/npm/simple-icons@3.0.1/icons/linkedin.svg" alt="Fazle Rabbi" height="30" width="auto" /></a>
<a target="_blank" href="https://twitter.com/fazle_rabbi_dev" ><img align="center" src="https://seeklogo.com/images/T/twitter-x-logo-101C7D2420-seeklogo.com.png?v=638258862800000000" alt="Fazle Rabbi" height="30" width="auto" /></a>
<a target="_blank" href="https://medium.com/@fazle-rabbi-dev" ><img align="center" src="https://cdn.jsdelivr.net/npm/simple-icons@3.0.1/icons/medium.svg" alt="Fazle Rabbi" height="30" width="auto" /></a>
<a target="_blank" href="https://dev.to/fazle-rabbi-dev" ><img align="center" src="https://seeklogo.com/images/D/dev-to-logo-BDC0EFA32F-seeklogo.com.png" alt="Fazle Rabbi" height="30" width="auto" /></a>
<a target="_blank" href="https://facebook.com/fazlerabbidev" ><img align="center" src="https://seeklogo.com/images/F/facebook-icon-black-logo-133935095E-seeklogo.com.png" alt="Fazle Rabbi" height="30" width="auto" /></a>
<a target="_blank" href="https://instagram.com/fazle_rabbi_dev" ><img align="center" src="https://cdn.jsdelivr.net/npm/simple-icons@3.0.1/icons/instagram.svg" alt="Fazle Rabbi" height="30" width="auto" /></a>

*Feel free to explore, contribute, and get inspired!*