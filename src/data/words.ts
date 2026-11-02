// The motivation corner. Calm lines, personal lines (use {n} for the name) and poems and sayings
// from classical and folk works. Meanings are gentle paraphrases.

export type Phase = 'start' | 'mid' | 'end' | 'done';

export interface Poem {
  text: string;
  mean: string;
  by: string;
}

type Lines = Record<'any' | Phase, string[]>;

export const CALM: Lines = {
  any: [
    'There’s no rush. Just this next small step.',
    'You don’t have to feel ready to keep going.',
    'Slow progress is still progress.',
    'Breathe in. Let your shoulders drop. Continue.',
    'One thing at a time is enough.',
    'The work is quietly adding up.',
    'Be gentle with yourself while you work hard.',
    'You don’t need to finish everything today. Just this part.',
    'Stay with it a little longer. It gets clearer.',
    'Rivers don’t hurry, and still they reach the sea.',
    'It’s okay if this feels hard. That’s how growing feels.',
    'Small, steady steps carry you further than rushed ones.',
    'Let the noise settle. Just you and this one task.',
    'You’re building something, even when it doesn’t feel like it.',
    'Doubt can sit beside you. It doesn’t get to steer.',
    'Progress is often quiet. Keep listening.',
    'Nothing to prove right now. Just something to do, and do well.',
    'A calm mind sees the next step more clearly.',
    'Rest your eyes for one breath, then return.',
    'Patience is part of the work.',
    'A mistake is only a signpost. Adjust, and continue.',
    'Trust the process you’ve started.',
    'Mountains are climbed one quiet step at a time.',
    'Showing up was the hardest part, and you’ve already done it.',
    'What you learn today will stay with you.',
    'Go softly. You’ll still get there.',
    'Today’s effort is a gift to tomorrow.',
    'Focus is a kind of peace.',
    'Even the tallest tree grew one ring at a time.',
    'Unclench your jaw. Soften your hands. Carry on.',
    'Not everything needs to be perfect. It needs to be done with care.',
    'Clarity comes to those who keep gently showing up.',
    'This moment, fully here, is enough.',
    'You are allowed to take this slowly.',
  ],
  start: [
    'Settle in. There’s nowhere else you need to be.',
    'Begin gently. The momentum will come.',
    'Take a slow breath. Let’s start.',
    'Set the world aside for a little while.',
  ],
  mid: [
    'You’re in the middle now. Steady is good.',
    'Halfway is a quiet kind of achievement.',
    'Keep your pace. You’re doing fine.',
    'Look how far you’ve come since you sat down.',
  ],
  end: [
    'Almost there. Finish softly.',
    'Just a few minutes more. Stay with it.',
    'The end is close. Let it come calmly.',
    'You’ve given this your time. Close it with care.',
  ],
  done: [
    'Well done. Rest your eyes and breathe.',
    'That was time well spent. Take a gentle pause.',
  ],
};

export const PERSONAL: Lines = {
  any: [
    '{n}, you’re doing better than you think.',
    'It’s okay if this part feels slow, {n}. You’re still moving.',
    'I know it feels a little heavy right now, {n}. You’ll come through it.',
    'Keep going, {n}. Quietly, steadily.',
    '{n}, you’ve handled hard things before. This is just one more.',
    'Breathe, {n}. You’re right where you need to be.',
    'You’re doing great, {n}. Really.',
    '{n}, be proud of the effort, not just the outcome.',
    'Little by little, {n}. That’s how it’s done.',
    'No one sees this quiet work, {n}, but it counts.',
    'It’s alright to go slowly, {n}. Just don’t stop.',
    'You’re growing with every line, {n}.',
    'Feeling stuck is temporary, {n}. Clarity is on its way.',
    '{n}, the future you is thankful for this hour.',
    'Take your time, {n}. You’ve got this.',
    'Be kind to yourself today, {n}. You’re trying, and that matters.',
  ],
  start: ['Welcome back, {n}. Let’s begin, gently.', 'Glad you’re here, {n}. One small step first.'],
  mid: ['Halfway, {n}. You’re holding steady.', '{n}, look at you. Still here, still going.'],
  end: ['Almost done, {n}. Finish softly.', 'Just a little more, {n}. You’re nearly there.'],
  done: ['Well done, {n}. Rest now.', 'You did it, {n}. Take a slow breath.'],
};

// Classical and folk works only (centuries old / traditional).
export const POEMS: Poem[] = [
  { text: 'धीरे-धीरे रे मना, धीरे सब कुछ होय।\nमाली सींचे सौ घड़ा, ऋतु आए फल होय॥', mean: 'Slowly, O mind, everything happens in its time. The gardener may pour a hundred pots, yet fruit comes only in its season.', by: 'Kabir' },
  { text: 'जिन खोजा तिन पाइयाँ, गहरे पानी पैठ।\nमैं बपुरा बूडन डरा, रहा किनारे बैठ॥', mean: 'Those who searched, diving into deep water, found it. Afraid of drowning, I sat on the shore. Go a little deeper.', by: 'Kabir' },
  { text: 'ऐसी वाणी बोलिए, मन का आपा खोय।\nऔरन को शीतल करे, आपहुँ शीतल होय॥', mean: 'Speak words that let go of ego. They cool the hearts of others, and bring calm to you as well.', by: 'Kabir' },
  { text: 'करत-करत अभ्यास के, जड़मति होत सुजान।\nरसरी आवत जात ते, सिल पर परत निसान॥', mean: 'With steady practice, even a slow mind grows wise. A soft rope, passing again and again, leaves its mark on stone.', by: 'Vrind' },
  { text: 'रहिमन चुप हो बैठिये, देखि दिनन के फेर।\nजब नीके दिन आइहैं, बनत न लगिहैं देर॥', mean: 'When days turn difficult, sit quietly and wait. When good days return, things will fall into place quickly.', by: 'Rahim' },
  { text: 'तुलसी साथी विपत्ति के, विद्या विनय विवेक।\nसाहस सुकृति सुसत्यव्रत, राम भरोसो एक॥', mean: 'In hard times your true companions are learning, humility, wisdom, courage, good deeds, truthfulness and faith.', by: 'Tulsidas' },
  { text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥', mean: 'Your part is the work itself, never its fruits. Don’t work only for the reward, and don’t turn away from the work.', by: 'Bhagavad Gita 2.47' },
  { text: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।', mean: 'Steady within, do your work, letting go of clinging.', by: 'Bhagavad Gita 2.48' },
  { text: 'योगः कर्मसु कौशलम्', mean: 'Yoga is skill in action.', by: 'Bhagavad Gita 2.50' },
  { text: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।', mean: 'Lift yourself up by your own self. Do not let yourself sink.', by: 'Bhagavad Gita 6.5' },
  { text: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥', mean: 'The mind is restless and hard to hold, no doubt. Yet through practice and letting go, it can be steadied.', by: 'Bhagavad Gita 6.35' },
  { text: 'उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।', mean: 'Work is fulfilled through steady effort, not by wishing alone.', by: 'Subhashita' },
  { text: 'बूँद-बूँद से घड़ा भरता है।', mean: 'Drop by drop, the pot is filled.', by: 'Hindi saying' },
  { text: 'ટીપે ટીપે સરોવર ભરાય.', mean: 'Drop by drop, the lake fills.', by: 'Gujarati saying' },
  { text: 'ધીરજનાં ફળ મીઠાં.', mean: 'The fruits of patience are sweet.', by: 'Gujarati saying' },
  { text: 'મન હોય તો માળવે જવાય.', mean: 'If the heart is willing, even faraway Malwa can be reached.', by: 'Gujarati saying' },
  { text: 'જાગ્યા ત્યારથી સવાર.', mean: 'Morning begins whenever you wake. It is never too late to begin.', by: 'Gujarati saying' },
  { text: 'जदि तोर डाक शुने केउ ना आसे,\nतबे एकला चलो रे॥', mean: 'If no one answers your call, walk on alone, calmly and without fear.', by: 'Rabindranath Tagore' },
  { text: 'साधु ऐसा चाहिए, जैसा सूप सुभाय।\nसार-सार को गहि रहै, थोथा देई उड़ाय॥', mean: 'Be like a winnowing basket: keep what is essential, and let the empty husk blow away.', by: 'Kabir' },
  { text: 'कस्तूरी कुंडल बसे, मृग ढूँढे बन माहि।\nऐसे घट-घट राम हैं, दुनिया देखे नाहिं॥', mean: 'The musk lies within the deer, yet it searches the forest. What you seek is already within you.', by: 'Kabir' },
  { text: 'माला फेरत जुग भया, फिरा न मन का फेर।\nकर का मनका डार दे, मन का मनका फेर॥', mean: 'Ages passed turning beads, yet the mind did not turn. Set the beads down; turn the mind itself.', by: 'Kabir' },
  { text: 'पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोय।\nढाई आखर प्रेम का, पढ़े सो पंडित होय॥', mean: 'Reading books alone made no one wise. One who understands the few letters of love is truly learned.', by: 'Kabir' },
  { text: 'निंदक नियरे राखिए, आँगन कुटी छवाय।\nबिन पानी, साबुन बिना, निर्मल करे सुभाय॥', mean: 'Keep honest critics close. Without water or soap, they gently make you better.', by: 'Kabir' },
  { text: 'मन के हारे हार है, मन के जीते जीत।', mean: 'Lose heart and you have lost; keep heart and you have already won.', by: 'Hindi saying' },
  { text: 'रहिमन देखि बड़ेन को, लघु न दीजिये डारि।\nजहाँ काम आवे सुई, कहा करे तरवारि॥', mean: 'Don’t discard small things for the big ones. Where a needle is needed, a sword is of no use. Small steps matter.', by: 'Rahim' },
  { text: 'जो रहीम उत्तम प्रकृति, का करि सकत कुसंग।\nचंदन विष व्यापत नहीं, लिपटे रहत भुजंग॥', mean: 'A good nature is not spoiled by its surroundings. Snakes may coil around sandalwood, yet it stays fragrant.', by: 'Rahim' },
  { text: 'रहिमन विपदा हू भली, जो थोरे दिन होय।\nहित अनहित या जगत में, जानि परत सब कोय॥', mean: 'Even a brief hardship has its gift: it shows you clearly who and what truly stands by you.', by: 'Rahim' },
  { text: 'कर्म प्रधान बिस्व करि राखा।\nजो जस करइ सो तस फलु चाखा॥', mean: 'The world rests on action. As one does, so one receives.', by: 'Tulsidas · Ramcharitmanas' },
  { text: 'धीरज धरम मित्र अरु नारी।\nआपद काल परिखिअहिं चारी॥', mean: 'Patience, virtue, friendship and companionship are truly known in difficult times.', by: 'Tulsidas · Ramcharitmanas' },
  { text: 'तुलसी मीठे बचन ते, सुख उपजत चहुँ ओर।\nबसीकरन इक मंत्र है, परिहरु बचन कठोर॥', mean: 'Sweet words spread happiness all around. Let go of harsh speech; gentleness wins every heart.', by: 'Tulsidas' },
  { text: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥', mean: 'Heat and cold, pleasure and pain come and go; they do not last. Bear them patiently.', by: 'Bhagavad Gita 2.14' },
  { text: 'स्वल्पमप्यस्य धर्मस्य त्रायते महतो भयात्॥', mean: 'Even a little of this steady practice protects you from great fear.', by: 'Bhagavad Gita 2.40' },
  { text: 'नियतं कुरु कर्म त्वं कर्म ज्यायो ह्यकर्मणः।', mean: 'Do the work that is yours to do; action is better than inaction.', by: 'Bhagavad Gita 3.8' },
  { text: 'न हि ज्ञानेन सदृशं पवित्रमिह विद्यते।', mean: 'Nothing in this world purifies like knowledge.', by: 'Bhagavad Gita 4.38' },
  { text: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।\nयुक्तस्वप्नावबोधस्य योगो भवति दुःखहा॥', mean: 'For one balanced in food and rest, in work, and in sleep and waking, practice dissolves sorrow.', by: 'Bhagavad Gita 6.17' },
  { text: 'शनैः कन्था शनैः पन्थाः शनैः पर्वतलङ्घनम्।\nशनैर्विद्या शनैर्वित्तं पञ्चैतानि शनैः शनैः॥', mean: 'Slowly a quilt is sewn, slowly a road is walked, slowly a mountain is crossed. Learning and wealth too come slowly, step by step.', by: 'Subhashita' },
  { text: 'क्षणशः कणशश्चैव विद्यामर्थं च साधयेत्।', mean: 'Moment by moment, grain by grain, gather learning and wealth.', by: 'Subhashita' },
  { text: 'विद्या ददाति विनयं विनयाद्याति पात्रताम्।', mean: 'Knowledge gives humility, and humility makes you worthy.', by: 'Hitopadesha' },
  { text: 'असतो मा सद्गमय। तमसो मा ज्योतिर्गमय।\nमृत्योर्मा अमृतं गमय॥', mean: 'Lead me from the unreal to the real, from darkness to light, from death to the timeless.', by: 'Brihadaranyaka Upanishad' },
  { text: 'सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।', mean: 'May all be happy. May all be free from illness.', by: 'Shanti mantra' },
  { text: 'सत्यमेव जयते', mean: 'Truth alone prevails.', by: 'Mundaka Upanishad' },
  { text: 'जहाँ चाह, वहाँ राह।', mean: 'Where there is a will, there is a way.', by: 'Hindi saying' },
  { text: 'सहज पके सो मीठा होय।', mean: 'What ripens naturally, in its own time, is the sweetest.', by: 'Hindi saying' },
  { text: 'ઉતાવળે આંબા ન પાકે.', mean: 'Mangoes don’t ripen in a hurry.', by: 'Gujarati saying' },
  { text: 'વાવો તેવું લણો.', mean: 'As you sow, so shall you reap.', by: 'Gujarati saying' },
  { text: 'પાણી પહેલાં પાળ બાંધવી.', mean: 'Build the embankment before the water comes. Prepare calmly, ahead of time.', by: 'Gujarati saying' },
  { text: 'સંપ ત્યાં જંપ.', mean: 'Where there is harmony, there is peace.', by: 'Gujarati saying' },
  { text: 'કરતાં જાળ કરોળિયો, ભોંય પડી પછડાય;\nવણ તૂટેલે તાંતણે, ઉપર ચડવા જાય.', mean: 'Weaving its web, the spider falls to the ground again and again, yet climbs back up on its unbroken thread.', by: 'Gujarati verse' },
  { text: 'વૈષ્ણવ જન તો તેને કહીએ,\nજે પીડ પરાઈ જાણે રે.', mean: 'Call that person truly good who feels the pain of others.', by: 'Narsinh Mehta' },
];

// ---------- languages ----------

export type Lang = 'en' | 'sa' | 'hi' | 'gu';

export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'sa', name: 'Sanskrit' },
  { id: 'hi', name: 'Hindi' },
  { id: 'gu', name: 'Gujarati' },
];

const POEM_LANG: Record<string, Lang> = {
  'Hindi saying': 'hi',
  'Gujarati saying': 'gu',
  'Gujarati verse': 'gu',
  'Narsinh Mehta': 'gu',
  'Kabir': 'hi',
  'Rahim': 'hi',
  'Vrind': 'hi',
  'Tulsidas': 'hi',
  'Tulsidas · Ramcharitmanas': 'hi',
  'Rabindranath Tagore': 'hi',
  'Subhashita': 'sa',
  'Hitopadesha': 'sa',
  'Shanti mantra': 'sa',
  'Mundaka Upanishad': 'sa',
  'Brihadaranyaka Upanishad': 'sa',
};

/** The language a poem or saying is written in. */
export function poemLang(p: Poem): Lang {
  if (p.by.startsWith('Bhagavad Gita')) return 'sa';
  return POEM_LANG[p.by] ?? 'hi';
}
