# SkillSwap

SkillSwap is a peer-to-peer learning and skill-sharing platform. It connects people who want to learn a skill with people who have knowledge or experience in that skill.

The main goal is to make learning more personalized and interactive through collaboration, knowledge exchange, and intelligent matchmaking.

## Introduction

Traditional learning platforms mainly focus on pre-recorded courses and generalized learning materials. These resources are useful, but they often lack personalized interaction, feedback, and direct collaboration.

SkillSwap provides a platform where users can share the skills they already know and specify the skills they want to learn. The system then helps users find suitable learning partners based on their skills and learning goals.

## Problem Statement

Existing learning platforms are mainly focused on content delivery rather than direct skill development and collaboration.

SkillSwap aims to address the following problems:

- Generic learning patterns
- Financial barriers to learning
- Difficulty selecting relevant learning resources
- Limited interaction and feedback
- Difficulty finding compatible learning partners
- Lack of trust and reputation between learners

## Objectives

The main objectives of SkillSwap are:

- Provide personalized peer-to-peer learning.
- Allow users to share their skills and knowledge.
- Reduce financial barriers to learning.
- Help users find compatible learning partners.
- Establish a reputation and trust system.
- Implement intelligent matchmaking.
- Encourage collaboration and continuous learning.

## Core Concept

Users provide two main types of information:

- Skills they can teach
- Skills they want to learn

The system uses this information to identify compatible users.

Example:

User A:
- Can teach: Java, Spring Boot
- Wants to learn: Machine Learning

User B:
- Can teach: Machine Learning
- Wants to learn: Spring Boot

The system can identify User A and User B as potential learning partners.

## Technology Stack

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- MongoDB
- Spring AI
- Ollama
- Maven

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Axios
- React Router
- Framer Motion

### Infrastructure

- Docker
- Docker Compose
- Elasticsearch

## Project Structure

    SkillSwap/
    ├── backend/
    │   ├── pom.xml
    │   └── src/
    │
    ├── frontend/
    │   ├── package.json
    │   ├── package-lock.json
    │   └── src/
    │
    ├── docker-compose.yml
    ├── .gitignore
    └── README.md

## Initialization

### Clone the Repository

    git clone https://github.com/NepAsh18/SkillSwap.git

    cd SkillSwap

### Backend

    cd backend

Build the project:

    ./mvnw clean install

Run the Spring Boot application:

    ./mvnw spring-boot:run

### Frontend

Open another terminal and navigate to the frontend:

    cd frontend

Install dependencies:

    npm install

Run the development server:

    npm run dev

## Configuration

Before running the project, configure the required application properties and environment variables.

The project may require configuration for:

- PostgreSQL
- MongoDB
- Elasticsearch
- JWT
- Ollama
- Other external services



## Development

The project uses separate branches for feature development.

Example:

    main
    ├── feature/authentication
    ├── feature/matchmaking
    ├── feature/ai
    ├── feature/chat
    └── feature/profile

The main branch contains the stable project, while feature branches are used for individual development.

## Future Development

- Real-time chat
- Video and audio communication
- AI-powered recommendations
- Advanced skill matchmaking
- User reputation and ratings
- Learning progress tracking
- Project-based collaboration
- Personalized assessments

## Vision

SkillSwap aims to make learning more interactive by connecting people with complementary skills.

Share what you know. Learn what you need. Grow together.
