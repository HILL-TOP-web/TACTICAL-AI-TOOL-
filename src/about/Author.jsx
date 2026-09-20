import React from "react";

export default function Author() {
  return (
    <section className="author-page">
      <div className="author-page__header">
        <h1>About the Author</h1>
        <h2>Daniel David Oluwayimika</h2>
        <p className="author-page__role">
          Founder &amp; Author of Tactical AI
        </p>
      </div>

      <div className="author-page__content">
        <p>
          Daniel David Oluwayimika is the founder and author of
          <strong> Tactical AI</strong>, a controlled fictional
          training and simulation platform designed to explore the
          application of artificial intelligence to tactical
          decision-making, structured training, and complex simulated
          environments.
        </p>

        <p>
          His interest in technology, artificial intelligence,
          military systems, coding, and structured problem-solving
          led to the creation of Tactical AI. The project brings
          these interests together into a single platform focused on
          <strong>
            {" "}
            simulation, training, decision support, terrain analysis,
            logistics, weather, route planning, knowledge management,
            and conversational AI
          </strong>.
        </p>

        <p>
          Tactical AI is designed around controlled fictional
          environments rather than real-world operational deployment.
          Its purpose is to provide a framework where users can
          explore scenarios, analyse information, practise
          decision-making, conduct simulated exercises, and review
          outcomes through structured after-action analysis.
        </p>

        <p>
          Daniel's vision for Tactical AI is to develop an intelligent
          platform capable of understanding simulated situations,
          organising complex information, generating structured
          briefings, supporting training exercises, and communicating
          with users through a specialised conversational interface.
        </p>

        <p>
          The platform is being developed with a modular architecture
          so that capabilities such as terrain analysis, situation
          awareness, logistics, routing, simulation engines,
          knowledge systems, training modules, and conversational
          intelligence can evolve independently while working
          together as one system.
        </p>

        <p className="author-page__closing">
          <strong>
            Tactical AI represents Daniel's vision of combining
            software engineering, artificial intelligence,
            simulation, and structured tactical training into one
            controlled digital environment.
          </strong>
        </p>
      </div>
    </section>
  );
      }
