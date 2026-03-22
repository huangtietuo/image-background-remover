# image-background-remover

🚀 AI-powered image background removal web application. Remove backgrounds from any image with just a few clicks.

## Features

- 🖱️ **Drag & Drop** - Easily drag and drop images to upload
- ⚡ **Fast Processing** - Powered by remove.bg API
- 🎨 **Clean UI** - Modern React frontend with intuitive design
- 🔒 **Privacy First** - Images are processed securely and deleted after processing
- 📱 **Responsive** - Works on desktop and mobile devices

## Project Structure

```
image-background-remover/
├── backend/          # Node.js/Express server
├── frontend/         # React frontend application
├── .gitignore
├── LICENSE
└── README.md
```

## Quick Start

### Backend Setup

1. Go to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
PORT=3001
REMOVE_BG_API_KEY=your_api_key_here
NODE_ENV=development
```

4. Get your API key at [remove.bg](https://www.remove.bg/api)

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Go to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

- `POST /api/upload` - Upload image for background removal
- `GET /api/status/:id` - Check processing status
- `GET /api/download/:id` - Download processed image

## Deployment

### Deploy to Vercel (Frontend)

```bash
npm install -g vercel
vercel
```

### Deploy to Heroku (Backend)

```bash
heroku create
git push heroku main
heroku config:set REMOVE_BG_API_KEY=your_key
```

### Deploy to Docker

```bash
docker build -t image-background-remover .
docker run -p 3001:3001 -e REMOVE_BG_API_KEY=your_key image-background-remover
```

## Configuration

| Environment Variable | Description | Required |
|----------------------|-------------|----------|
| `REMOVE_BG_API_KEY` | API key from remove.bg | Yes |
| `PORT` | Port number for backend | No (default 3001) |
| `NODE_ENV` | Environment mode | No (default development) |
| `MAX_FILE_SIZE` | Maximum upload file size in MB | No (default 10) |

## Development

```bash
# Install root dependencies (if using concurrently)
npm install

# Run both frontend and backend in development mode
npm run dev
```

## Tech Stack

- **Frontend**: React, CSS3, Drag & Drop API
- **Backend**: Node.js, Express.js, Multer
- **AI Processing**: remove.bg API
- **Build**: Create React App

## Screenshots

*(Add your screenshots here)*

## Contributing

Contributions, issues, and feature requests are welcome!

## License

MIT © [huangtietuo](https://github.com/huangtietuo)
