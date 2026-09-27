/**
 * Serap Yıldırım Portfolio V3
 * Central content model. All paths are local to this project.
 *
 * Optional project fields, each read only by the project page:
 *   coverPosition  focal point of the cover where a frame crops it, e.g. "50% 32%"
 *   personas     About-page persona ids; the Work page persona lens filters by them
 *   documents    drawings and boards shown uncropped at full width, with their caption
 *   viewpoints   plan with the camera position of selected renders
 *   reference    source artwork shown before the project's own images, credited
 *   chapters     gallery grouped into titled sections, in the given order
 *   materials    material palette listed next to the project facts
 *   book         page-by-page reader with register tabs; replaces the gallery
 *   reduction    heritage mark beside the new mark
 *   summary      short strategy notes
 *   tone         page colour while the project is on screen: "matisse" or "charcoal"
 *   gesture      "cutouts" (Light Paints) or "fold" (Origami) for the gallery entrance
 *   pace         "slow" lengthens the gallery entrance
 */

(function () {
  const FRENCH = "assets/projects/03-french-elegance";
  const LIGHT = "assets/projects/01-light-paints-the-room";
  const BOOK = "assets/projects/09-Brand strategy book";
  const KAMER = "assets/projects/02-kamer-marble";
  const ATTIC = "assets/projects/07-motion-studies";
  const VILLA = "assets/projects/05-mp-villa";
  const ORIGAMI = "assets/projects/08-origami-collection";

  const villaChapters = [
    ["Arrival", [1]],
    ["Living & Kitchen", [2, 3, 4, 5, 9]],
    ["Stair & Light Well", [6, 20, 7, 8, 19]],
    ["Master Suite", [10, 11, 12, 18]],
    ["Second Bedroom", [13, 14]],
    ["Attic Floor", [15, 16, 17]],
  ].map(([title, numbers]) => ({
    title,
    images: numbers.map((number) => `${VILLA}/${number}.jpg`),
  }));

  const bookSpreads = [
    ...Array.from({ length: 27 }, (_, index) => [index * 2 + 1, index * 2 + 2]),
    [55],
    [56, 57],
  ];

  const bookFeatured = [
    "01-spread-03-04",
    "02-spread-09-10",
    "03-spread-17-18",
    "04-spread-19-20",
    "05-spread-29-30",
    "06-spread-33-34",
    "07-spread-35-36",
    "08-spread-37-38",
    "09-spread-43-44",
    "10-spread-45-46",
    "11-spread-49-50",
    "12-spread-53-54",
  ].map((name) => `${BOOK}/spreads/${name}.jpg`);

  window.PORTFOLIO_DATA = {
    site: {
      name: "Serap Yıldırım",
      role: "Multidisciplinary Designer",
      location: "Based in Germany",
      email: "serapyldrm.dsgn@gmail.com",
      social: {
        instagram: "https://www.instagram.com/serapyildiriminteriors?igsh=MTVwNHU1c2MxNThtdg==",
        behance: "https://www.behance.net/serapyldrmfc6f",
        linkedin: "https://www.linkedin.com/in/serap-y%C4%B1ld%C4%B1r%C4%B1m-4709288a/",
      },
      menuVideo: "Intro/Intro.mp4",
      menuMedia: {
        home: "assets/home/Kırmızı-intro.mp4",
        work: "assets/home/pembe.mp4",
        lab: "assets/home/sari.mp4",
        about: "assets/home/mavi .mp4",
      },
    },

    about: {
      short: [
        "I AM NOT ONE THING. I MOVE BETWEEN WORLDS. A ROOM CAN BECOME A STORY. A PRODUCT CAN BECOME A CHARACTER. A BRAND CAN BECOME A WORLD. I DO NOT DESIGN ONLY THINGS. I BUILD VISUAL WORLDS. BETWEEN SPACE AND IMAGE, BRAND AND STORY, LIGHT AND MEMORY. FOR ME, THIS IS NOT CONFUSION. IT IS A WAY OF SEEING.",
      ],
      extended:
        "I am not one thing. I am on my way, and somehow already at home. I am drawn to many things at once — to movement and stillness, to discipline and desire, to silence and spectacle, to the intimate detail and the larger stage. For me, this is not confusion. It is a way of seeing. My work begins where categories start to dissolve: between space and image, between brand and story, between object and atmosphere, between what is built and what is felt. With a background in interior architecture, I learned to read spaces — their rhythm, their silence, their hidden drama. But my practice does not belong only to interiors. It expands into brand worlds, campaign concepts, visual identities, moving images, music video atmospheres and staged narratives. I see every project as a scene. A room can become a story. A product can become a character. A brand can become a world. A frame, a gesture, a colour, a texture or a light can touch emotion before a single word is spoken. What I search for is not only beauty, but resonance. I want to create things that stay with people — in their memory, in their senses, in the atmosphere around them. Beautiful things, yes. But also meaningful things. Images, spaces and worlds that do not only appear, but remain.",
      signature: "assets/about/signature.png",
      avatars: [
        {
          id: "identity-builder",
          video: "assets/avatar/V4-persona-identity-builder.mp4",
          poster: "assets/avatar/persona-identity-builder.png",
          label: "The Identity Builder",
          discipline: "Brand Identity / Branding / Editorial Design",
          statement: "I translate cultural memory and vision into coherent visual systems.",
        },
        {
          id: "experimenter",
          video: "assets/avatar/V2-persona-experimenter.mp4",
          poster: "assets/avatar/persona-experimenter.png",
          label: "The Experimenter",
          discipline: "Research / Experimental Design / Digital / Material",
          statement: "I explore the edges — unfinished, speculative, always in motion.",
        },
        {
          id: "spatialist",
          video: "assets/avatar/V3-persona-spatialist.mp4",
          poster: "assets/avatar/persona-spatialist.png",
          label: "The Spatialist",
          discipline: "Interior Architecture / Spatial Design / 3D",
          statement: "I shape atmosphere through material, light and the logic of space.",
        },
        {
          id: "storyteller",
          video: "assets/avatar/V1-persona-storyteller.mp4",
          poster: "assets/avatar/persona-storyteller.png",
          label: "The Storyteller",
          discipline: "Art Direction / Visual Storytelling / Motion",
          statement: "I build narrative worlds where image, motion and mood converge.",
        },
      ],
    },

    projects: [
      {
        id: "03",
        slug: "03-french-elegance",
        title: "French Elegance",
        subtitle: "The reflection of French elegance",
        year: "2024",
        discipline: "Interior Architecture",
        role: "Interior Concept & 3D Visualization",
        client: "Personal Project",
        tags: ["Spatial Design", "Living Room", "Atmosphere"],
        personas: ["spatialist"],
        cover: `${FRENCH}/1.jpg`,
        images: [
          `${FRENCH}/1.jpg`,
          `${FRENCH}/2.jpg`,
          `${FRENCH}/03.jpg`,
          `${FRENCH}/detay 1.jpg`,
          `${FRENCH}/detay 2.jpg`,
          `${FRENCH}/detay 3.jpg`,
          `${FRENCH}/detay 4_.jpg`,
          `${FRENCH}/8.jpg`,
          `${FRENCH}/French01 - Living Room with Galery Plan.png`,
          `${FRENCH}/French02- Section.png`,
        ],
        documents: {
          [`${FRENCH}/French01 - Living Room with Galery Plan.png`]: "Board — living room with gallery, plan and design objective",
          [`${FRENCH}/French02- Section.png`]: "Board — section through the living room and gallery",
        },
        viewpoints: {
          plan: `${FRENCH}/PLAN OA.png`,
          width: 3617,
          height: 3397,
          caption: "Ground floor plan — the living room opens north to the glazing, the dining gallery lies beneath the mezzanine.",
          cameras: [
            { image: `${FRENCH}/1.jpg`, x: 1330, y: 1180, angle: 4, fov: 100, reach: 520, label: "Looking east — sofa, wine wall and dining gallery" },
            { image: `${FRENCH}/2.jpg`, x: 2285, y: 1180, angle: 176, fov: 100, reach: 520, label: "Looking west — fireplace wall and arched window" },
            { image: `${FRENCH}/03.jpg`, x: 1808, y: 630, angle: 90, fov: 80, reach: 520, label: "From the glazing — across the sofa towards the gallery" },
            { image: `${FRENCH}/8.jpg`, x: 1808, y: 1166, angle: 90, fov: 48, reach: 560, label: "The dining axis beneath the mezzanine" },
          ],
        },
        description:
          "The reflection of French elegance and Art Deco through my eclectic lens. This living room combines timeless sophistication with bold geometry, layered textures, sculptural furniture, deep burgundy accents and softened natural light.",
      },
      {
        id: "09",
        slug: "09-diefenthal-1905",
        title: "Diefenthal 1905",
        subtitle: "Brand strategy book",
        year: "2026",
        discipline: "Brand Identity",
        role: "Brand Strategy, Corporate Design & Editorial Design",
        client: "Master’s project · HAWK Hildesheim",
        tags: ["Brand Strategy", "Corporate Design", "Editorial Design"],
        personas: ["identity-builder"],
        cover: `${BOOK}/cover-magazine.jpg`,
        coverPosition: "50% 4%",
        images: bookFeatured,
        tone: "charcoal",
        reduction: {
          from: {
            src: `${BOOK}/emblems/heritage-old.png`,
            title: "Das Erbe",
            terms: "Ornament · Handwerk · Herkunft",
            note: "The heritage mark",
          },
          to: {
            src: `${BOOK}/emblems/primary-new.png`,
            title: "Die Weiterentwicklung",
            terms: "Reduktion · Kontinuität · Präzision",
            note: "The new primary emblem",
          },
          statement: "Nicht neu erfunden, sondern aus der bestehenden Identität weiterentwickelt.",
          translation: "Not reinvented — developed from the identity that was already there.",
        },
        book: {
          title: "Brand Strategy Book",
          pages: 57,
          page: (number) => `${BOOK}/pages/p${String(number).padStart(2, "0")}.jpg`,
          spreads: bookSpreads,
          tabs: [
            { label: "Inhalt", page: 5 },
            { label: "Analyse", page: 9 },
            { label: "Konzeption", page: 23 },
            { label: "Strategie", page: 26 },
            { label: "Corporate Design", page: 29 },
            { label: "Anwendung", page: 41 },
            { label: "Bildsprache", page: 48 },
            { label: "Fazit", page: 55 },
          ],
        },
        summary: [
          {
            label: "Positioning",
            title: "Heritage ohne Museum",
            text: "Atelier-first, not nostalgia tourism: the hat is shown as living craft, not as a relic behind glass.",
          },
          {
            label: "Tone of voice",
            title: "Souverän, warm, sachlich",
            text: "Like a conversation in the atelier, not an advertising campaign.",
          },
          {
            label: "Colour",
            title: "Charcoal & Ivory carry 80–90 %",
            text: "Muted Brass structures, Oxblood only signs — a controlled signature detail.",
            swatches: [
              ["Charcoal Black", "#1E1E1C"],
              ["Ivory", "#F4F0E8"],
              ["Muted Brass", "#B89A5E"],
              ["Oxblood", "#5A1F25"],
              ["Warm Stone", "#D8D2C7"],
            ],
          },
          {
            label: "Emblem",
            title: "Vier Blattformen",
            text: "Four leaf forms at the centre of the emblem for four generations of Diefenthal.",
          },
        ],
        description:
          "A brand strategy and corporate design book for Diefenthal 1905, a family hat maker in Cologne. The identity was not reinvented but developed from what was already there: ornament, craft and origin reduced into a calm, precise system of Charcoal and Ivory, Bodoni typography and an emblem whose four leaf forms stand for four generations.\n\nThe 57-page book moves from briefing, desk research and personas through insight and positioning to the corporate design and its applications — packaging, retail, editorial and a photographic language built on archive, craft and character.",
      },
      {
        id: "02",
        slug: "02-kamer-marble",
        title: "Kamer Marble",
        subtitle: "Material showroom experience",
        year: "2023",
        discipline: "Spatial Design",
        role: "Spatial Design",
        client: "Kamer Marble",
        tags: ["Showroom", "Material", "Interior"],
        personas: ["spatialist"],
        cover: `${KAMER}/1.jpg`,
        images: [
          `${KAMER}/1.jpg`,
          `${KAMER}/2.0.jpg`,
          `${KAMER}/2.1. Kamer Showroom - System.png`,
          `${KAMER}/3.jpg`,
          `${KAMER}/4.0.jpg`,
          `${KAMER}/4.1. Kamer-Management Floor Plan.png`,
          `${KAMER}/5.jpg`,
          `${KAMER}/6.jpg`,
          `${KAMER}/7.jpg`,
          `${KAMER}/8.jpg`,
          `${KAMER}/9.jpg`,
        ],
        documents: {
          [`${KAMER}/2.1. Kamer Showroom - System.png`]: "Board — showroom system",
          [`${KAMER}/4.1. Kamer-Management Floor Plan.png`]: "Drawing — management floor plan",
        },
        description:
          "Developed under Orhandemirçelik Architecture, this project moved from concept and visualization through technical drawings, site supervision and completion. The administrative building of a marble factory was transformed into an elegant working environment and a monumental showroom demonstrating the material’s many applications.\n\nThe project balances functionality, material storytelling and a refined visitor experience.",
      },
      {
        id: "07",
        slug: "07-motion-studies",
        title: "Attic Floor Porsche Inspired",
        subtitle: "Space for indulgence and calm",
        year: "2024",
        discipline: "Visual Storytelling",
        role: "Art Direction & Motion",
        client: "Personal Project",
        tags: ["Motion", "Atmosphere", "Spatial Study"],
        personas: ["spatialist", "storyteller"],
        cover: `${ATTIC}/cover.jpg`,
        coverPosition: "50% 32%",
        images: [
          `${ATTIC}/cover.jpg`,
          `${ATTIC}/2.jpg`,
          `${ATTIC}/3.jpg`,
          `${ATTIC}/4.jpg`,
          `${ATTIC}/5.jpg`,
          `${ATTIC}/6.jpg`,
          `${ATTIC}/7.jpg`,
          `${ATTIC}/08.jpg`,
          `${ATTIC}/9.jpg`,
          `${ATTIC}/10.jpg`,
          `${ATTIC}/11.jpg`,
          `${ATTIC}/12.jpg`,
          `${ATTIC}/13.jpg`,
          `${ATTIC}/15.jpg`,
          `${ATTIC}/16.jpg`,
          `${ATTIC}/18.jpg`,
          `${ATTIC}/19.jpg`,
          `${ATTIC}/Porsche -Floor Plan.jpg`,
        ],
        documents: {
          [`${ATTIC}/Porsche -Floor Plan.jpg`]: "Drawing — attic floor plan",
        },
        materials: ["Ceramic", "Warm wood", "Veneer", "Chrome", "Glass"],
        pace: "slow",
        description:
          "Inspired by the formal language and material atmosphere of Porsche, the project creates a private retreat for pleasure, gathering and deceleration. A new roof opening introduces light and height, while ceramic, warm wood, veneer, chrome and glass build a tension between nostalgia and contemporary clarity.",
      },
      {
        id: "05",
        slug: "05-mp-villa",
        title: "M.P. Villa",
        subtitle: "Private residential interior",
        year: "2022",
        discipline: "Interior Architecture",
        role: "Interior Architecture",
        client: "Private",
        tags: ["Residential", "Spatial Narrative"],
        personas: ["spatialist"],
        cover: `${VILLA}/6.jpg`,
        images: villaChapters.flatMap((chapter) => chapter.images),
        chapters: villaChapters,
        description:
          "Developed under Orhandemirçelik Architecture, M.P. Villa was guided from concept and visualization through drawings, site supervision and final delivery. The interior is conceived as a coherent residential story where elegance and everyday functionality meet.",
      },
      {
        id: "08",
        slug: "08-origami-collection",
        title: "Origami Collection",
        subtitle: "Young room furniture collection",
        year: "2022",
        discipline: "Product / Spatial",
        role: "Furniture Collection Design",
        client: "Personal Project",
        tags: ["Furniture", "Collection", "Interior"],
        personas: ["spatialist", "experimenter"],
        cover: `${ORIGAMI}/02-bedroom-evening.jpg`,
        images: [
          `${ORIGAMI}/02-bedroom-evening.jpg`,
          `${ORIGAMI}/01-bedroom-suite.jpg`,
          `${ORIGAMI}/03-desk-and-shelving.jpg`,
          `${ORIGAMI}/04-chest-of-drawers.jpg`,
          `${ORIGAMI}/05-sliding-wardrobe.jpg`,
          `${ORIGAMI}/06-upholstered-bedroom.jpg`,
          `${ORIGAMI}/07-bedroom-with-cheval-mirror.jpg`,
          `${ORIGAMI}/08-bed-and-painted-arch.jpg`,
          `${ORIGAMI}/09-mirrored-wardrobe.jpg`,
          `${ORIGAMI}/10-study-desk.jpg`,
          `${ORIGAMI}/11-bedside-detail.jpg`,
          `${ORIGAMI}/12-vanity-still-life.jpg`,
        ],
        gesture: "fold",
        description:
          "A young room furniture collection inspired by origami — fold, function and play. Geometric clarity and soft materials create pieces that adapt to growing spaces.",
      },
      {
        id: "01",
        slug: "01-light-paints-the-room",
        title: "Light Paints the Room",
        subtitle: "Matisse-inspired lighting campaign",
        year: "2024",
        discipline: "Art Direction",
        role: "Art Direction & Product Styling",
        client: "Personal Project",
        tags: ["Product Styling", "Lighting", "Campaign"],
        personas: ["storyteller", "experimenter"],
        cover: `${LIGHT}/1.jpg`,
        images: [
          `${LIGHT}/1.jpg`,
          `${LIGHT}/3.jpg`,
          `${LIGHT}/4.JPG`,
          `${LIGHT}/5.JPG`,
        ],
        reference: {
          src: `${LIGHT}/2.jpg`,
          label: "Reference",
          caption: "Henri Matisse, Harmony in Red (La Desserte), 1908. The State Hermitage Museum, St Petersburg. Shown as the starting point of the project — not my work.",
          next: "Interpretation",
        },
        tone: "matisse",
        gesture: "cutouts",
        description:
          "This project is a spatial interpretation of Henri Matisse’s Harmony in Red from 1908. Rather than recreating the painting as an exact copy, I translated its atmosphere into a real interior setting.\n\nMatisse used colour not simply as decoration, but as a way to shape emotion, perception and space. The dominant red surface, blue floral ornaments, fruits, flowers and table composition were reimagined as physical elements within a staged interior.\n\nInspired by Matisse’s later papiers découpés, I created the ornamental elements by hand. Natural light brings the room into a contemporary, lived reality — a dialogue between painting, photography and interior design.",
      },
    ],

    lab: [
      {
        id: "lab-01",
        title: "Motion Fragment",
        category: "Moving Image",
        type: "video",
        src: "assets/lab/0201(5).mp4",
        note: {
          meta: "Moving image · Digital study",
          text: "A velvet curtain parts onto an object suspended between sky and water — a short study in staging, reveal and surreal scale.",
        },
      },
      {
        id: "lab-view-of-artist",
        title: "View of Artist",
        category: "Moving Image",
        type: "video",
        src: "assets/lab/view of artist.mp4",
        note: {
          meta: "Moving image · Digital study",
          text: "Surfaces ripple like fabric until an ornament surfaces from the dark — rhythm, texture and the moment an object becomes precious.",
        },
      },
      {
        id: "lab-02",
        title: "Threaded Memory",
        category: "Visual Research",
        type: "image",
        src: "assets/lab/11df0748-b7e1-4d40-a7ab-26f406becb1f.png",
        note: {
          meta: "Visual research · Concept image",
          text: "A music-box dancer kept in a vitrine on a woven kilim: memory treated as an exhibit, held together by red thread.",
        },
      },
      {
        id: "lab-03",
        title: "Light as Character",
        category: "Visual Research",
        type: "image",
        src: "assets/lab/27bd180792717e1ec06be0a84f7ab5e3.jpg",
        note: {
          meta: "Visual research · Collected reference",
          text: "Lamps drawn as lines, people cut from photographs — kept as a reference for staging light objects as characters with a personality of their own.",
        },
      },
      {
        id: "lab-04",
        title: "Circular Museum Study",
        category: "Spatial Research",
        type: "image",
        src: "assets/lab/5ca688b4bfdd0d3127d26571f9a6e200.jpg",
        note: {
          meta: "Spatial research · Collected reference",
          text: "A museum programme organised as linked circular rooms, the visitor route drawn in red — collected for circulation as narrative.",
        },
      },
      {
        id: "lab-textile-design",
        title: "Textile Design",
        category: "Textile Research",
        type: "sequence",
        sources: [
          "assets/lab/textile design/1.jpeg",
          "assets/lab/textile design/2.jpeg",
          "assets/lab/textile design/3.jpeg",
          "assets/lab/textile design/4.jpeg",
          "assets/lab/textile design/5.jpeg",
          "assets/lab/textile design/6.jpeg",
          "assets/lab/textile design/7.jpeg",
        ],
        note: {
          meta: "Textile research · Own work",
          text: "Lamp shade, bedding and blankets for a young room, developed as one soft collection and photographed in use. Hover to look closer.",
        },
      },
      {
        id: "lab-07",
        title: "Exhibition Orbit",
        category: "Spatial Research",
        type: "image",
        src: "assets/lab/8932fa63303ece75892528fab53bab50.jpg",
        note: {
          meta: "Spatial research · Collected reference",
          text: "A sparse drawing of an exhibition set along one curved wall — display as an orbit the visitor moves around.",
        },
      },
      {
        id: "lab-08",
        title: "Earth Architecture Model",
        category: "Spatial Research",
        type: "image",
        src: "assets/lab/9152395b949268dbac15a29c75678ced.jpg",
        note: {
          meta: "Spatial research · Collected reference",
          text: "A printed model of clustered earthen domes, collected for its material logic: form, structure and climate from a single substance.",
        },
      },
      {
        id: "lab-09",
        title: "Program Loop",
        category: "Spatial Research",
        type: "image",
        src: "assets/lab/b706b06dd1a6ac918e6a174ce50d0cd3.jpg",
        note: {
          meta: "Spatial research · Collected reference",
          text: "Diagrams that bend a linear programme into loops — a reference for turning a street-like sequence of rooms into one continuous path.",
        },
      },
      {
        id: "lab-10",
        title: "Earthen Settlement",
        category: "Spatial Research",
        type: "image",
        src: "assets/lab/bc090a64038682eac3810a2fe0812e8c.jpg",
        note: {
          meta: "Spatial research · Collected reference",
          text: "A collaged village of earthen domes set into landscape strata — kept beside the model as a study of how a settlement grows from one form.",
        },
      },
      {
        id: "lab-11",
        title: "Open Road Portrait",
        category: "Field Notes",
        type: "image",
        src: "assets/lab/f979ca8a-0bcd-4c69-b7ea-55293598d278.jpg",
        note: {
          meta: "Field notes · Portrait",
          text: "A portrait on an open road at dusk — styling, posture and landscape composed as one frame.",
        },
      },
      {
        id: "lab-12",
        title: "On Set — Green Screen",
        category: "Field Notes",
        type: "image",
        src: "assets/lab/IMG_20211210_073408@1259833794.jpg",
        note: {
          meta: "Field notes · On set, 2021",
          text: "Behind a green-screen shoot: the grid of light, cables and waiting that every staged image is built on.",
        },
      },
      {
        id: "lab-13",
        title: "On Set — Product World",
        category: "Field Notes",
        type: "image",
        src: "assets/lab/IMG_20230603_122353@-556364057.jpg",
        note: {
          meta: "Field notes · On set, 2023",
          text: "A product set in the making — pastel props, softboxes and the camera finding its angle: styling as spatial design at a small scale.",
        },
      },
      {
        id: "lab-pop-up-portfolio",
        title: "Pop-up Portfolio",
        category: "Moving Image",
        type: "video",
        src: "assets/lab/Pop-up portfolio.mp4",
        note: {
          meta: "Moving image · Own work · 4:56",
          text: "A hand-made pop-up portfolio filmed page by page: plans and interiors fold up into paper rooms, turning a presentation into a small spatial experience.",
        },
      },
    ],
  };
})();
