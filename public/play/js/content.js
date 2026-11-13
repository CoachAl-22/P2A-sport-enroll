// DRAFT. Alistair reviews this file before any real kid plays.
//
// QUOTED word for word from MAJ-QUEST-I.html: every learn.lines entry; the sprint cue and the tempo cue;
//   the jump's push cue (jump.phases.push, Week 4; Coach Al confirmed it for the long jump on 6 Nov 2026) and its learn.lines. Jump learn.lines[0] is from
//   Week 4; learn.lines[1] and [2] are from the bounding drill list (about lines 726-727), please confirm.
//   SHARED.creed is word for word from the Hero's Journal.
// NOT in the Quest I file, please confirm or replace: the skip cue (Coach Al's wording from the design
//   conversation on 4 Nov 2026, "opposite arm, opposite leg, swing arms forward and back (no hop)", with
//   "smooth not fast" added by the builder) and the reel cue (drafted by the builder).
// Coach Al's words from 6 Nov 2026, please confirm: the jump cue "Run fast at the board." and the
//   one-shoe line (jump.coach.oneShoe).
// APPROVED by Coach Al on 6 Nov 2026: the jump's take-off cue (jump.phases.takeoff), drafted by the builder to
//   replace Quest I's "Jet wings on take-off", which is a standing broad jump cue, not a long jump one.
// COACH AL's words, 6 Nov 2026: the jump's landing cue (jump.phases.landing), replacing "Motorbike landing".
// DRAFTED in Coach Al's voice for his approval: headings, tips, reflect questions and choices, unlock
//   lines, SHARED.intro, SHARED.lightsOff, SHARED.nearly, SHARED.lightning; and for the jump, the
//   heading, the coach foul, no-jump and practice lines, tips, reflect and unlock lines.

// DRAFT (except creed, quoted from the Hero's Journal): shared game text.
export const SHARED = {
  creed: 'I am the hero of my journey.',
  intro: "Welcome to Explorer's Run, part of your Athletic Journey. Play a few rounds, then show me for real.",
  lightsOff: 'Lights off. You have the rhythm!',
  nearly: 'NEARLY!',
  lightning: 'LIGHTNING START',
};

export const CONTENT = {
  skip: {
    // QUOTED lines (Week 2) and DRAFTED title/heading/tips/reflect/unlock. The cue is NOT in the Quest I file: please confirm.
    title: 'Skip Trail',
    week: 'Week 2',
    skillName: 'Smooth Skip',
    learn: {
      heading: 'Skip with a smooth swing',
      cue: 'Opposite arm, opposite leg. Swing the arms, smooth not fast.',
      lines: [
        'Good movement is the foundation everything else is built on.',
        'Skipping, jumping, and running require coordinated patterns.',
        'Slow is smooth. Smooth is fast. Quality first, speed second.',
      ],
    },
    tips: {
      low: 'Try this: when your left foot lifts, swing your right arm.',
      mid: 'Nice rhythm. Next, keep both arms swinging the same size each skip.',
      high: 'Smooth arms and legs working together. Show your coach next session.',
    },
    reflect: {
      question: 'Which part of the skip felt trickiest today?',
      choices: ['Matching my arms and legs', 'Keeping a smooth rhythm', 'It all felt pretty good'],
    },
    unlock: {
      line: 'You unlocked Smooth Skip: arms and legs working as a team.',
      nowDoIt: 'Now do it for real. Show your coach next session.',
    },
  },
  sprint: {
    // QUOTED lines and cue (Week 3) and DRAFTED title/heading/tips/reflect/unlock.
    title: 'Sprint Track',
    week: 'Week 3',
    skillName: 'Sprint Drive',
    learn: {
      heading: 'Fast arms, fast feet',
      cue: 'Head still, short fast arms, fast feet.',
      lines: [
        'Arms control legs.',
        'First 10m is where races are won.',
        'Speed comes from: powerful push-off, fast arm drive, forward lean from ankles.',
      ],
    },
    tips: {
      low: 'Try this: swing your arms forward and back, not across.',
      mid: 'Quick arms! Next, keep your hands loose.',
      high: 'Quick arms and a still head. Show your coach next session.',
    },
    reflect: {
      question: 'When did you feel fastest today?',
      choices: ['Right out of the start', 'When my arms were pumping', 'Not sure yet, I will look for it'],
    },
    unlock: {
      line: 'You unlocked Sprint Drive, quick arms driving quick feet.',
      nowDoIt: 'Now do it for real. Show your coach next session.',
    },
  },
  jump: {
    // QUOTED lines and phase cues (Week 4). The cue and coach.oneShoe are Coach Al's words from 6 Nov 2026: please confirm.
    // DRAFTED title/heading/coach foul, no-jump and practice lines/tips/reflect/unlock.
    title: 'Jump Pit',
    week: 'Week 4',
    skillName: 'Long Jump',
    learn: {
      heading: 'Run fast, jump far, land strong',
      cue: 'Run fast at the board.',
      lines: [
        'Power = strength applied quickly.',
        'Drive arms hard from push-off',
        'Soft landings = skilled, not weak',
      ],
    },
    phases: {
      takeoff: 'Drive your knee up on take-off.',
      push: 'Reach for the sky.',
      landing: 'Land on both feet.',
    },
    coach: {
      foul: 'Over the board. No jump this time.',
      noJump: 'You ran right through. Next time, hit JUMP on the board.',
      oneShoe: 'Move your start back one shoe and try again.',
      practice: 'Practise the landing. Hold JUMP, let go, then RUN and JUMP together.',
    },
    // The jump result card does not use tips.low or tips.mid yet: its tip comes from what happened.
    tips: {
      low: 'Try this: keep running fast right up to the board.',
      mid: 'Strong take-off. Next, land on two feet with soft knees.',
      high: 'Fast run, big push, soft landing. Show your coach next session.',
    },
    reflect: {
      question: 'Which part of the jump felt best today?',
      choices: ['Running fast at the board', 'Pushing up into the air', 'Landing on two feet'],
    },
    unlock: {
      line: 'You unlocked Long Jump: fast run, big push, soft landing.',
      nowDoIt: 'Now do it for real. Show your coach next session.',
    },
  },
  tempo: {
    // QUOTED lines and cue (Week 6) and DRAFTED title/heading/tips/reflect/unlock.
    title: 'Tempo Trail',
    week: 'Week 6',
    skillName: 'Tempo Runner',
    learn: {
      heading: 'Run steady, stay relaxed',
      cue: 'Relaxed shoulders, steady breathing, head still.',
      lines: [
        'When it gets hard, focus on the next 30 seconds, not the whole remaining time.',
      ],
    },
    tips: {
      low: 'Try this: drop your shoulders and breathe slow and deep.',
      mid: 'Good steady pace. Next, loosen your hands to save energy.',
      high: 'Calm shoulders, steady breath. Show your coach next session.',
    },
    reflect: {
      question: 'What helped you keep going when it got hard?',
      choices: ['Thinking about the next 30 seconds', 'Breathing slow and steady', 'Having a mate beside me'],
    },
    unlock: {
      line: 'You unlocked Tempo Runner, steady and relaxed all the way.',
      nowDoIt: 'Now do it for real. Show your coach next session.',
    },
  },
  reel: {
    // QUOTED lines (Week 8) and DRAFTED title/heading/tips/reflect/unlock. The cue is NOT in the Quest I file: please confirm.
    title: 'Highlight Reel',
    week: 'Week 8',
    skillName: 'Module 1 Master',
    learn: {
      heading: 'Put it all together',
      cue: 'Everything you have built. Show it.',
      lines: [
        'Week 1 = starting point. Week 8 = measure of progress.',
        'Every session, every reflection, every challenge counts.',
      ],
    },
    tips: {
      low: 'Try this: pick one cue and focus on just that.',
      mid: 'Lots of skills showing up. Make your best one smooth.',
      high: 'Smooth, quick and steady in one run. Show your coach.',
    },
    reflect: {
      question: 'What are you most proud of from Module 1?',
      choices: ['How my skipping has improved', 'How fast I can move now', 'Not giving up when it got hard'],
    },
    unlock: {
      line: 'You unlocked Module 1 Master. Everything you built, together.',
      nowDoIt: 'Now do it for real. Show your coach next session.',
    },
  },
};
