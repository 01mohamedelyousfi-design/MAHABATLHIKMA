/**
 * lesson-seeds.js — curated review items for each canonical MahabatLhikma lesson.
 *
 * IMPORTANT PRODUCT RULE: every item is grounded in the actual lesson content
 * published on the site (philosophers' texts, simplified explanations and
 * comparison tables). The AI evaluator only judges learner answers against
 * these points plus the canonical lesson text; it never invents content.
 *
 * These seeds act as:
 *   1. the v1 QuestionGenerator output (no paid AI needed at zero cost), and
 *   2. the source from which lesson_concepts + review_items are created.
 */

export const LESSON_SEEDS = {
  'person-identity': {
    concepts: [
      { id: 'locke', name: 'موقف جون لوك', description: 'الهوية الشخصية قائمة على الوعي والذاكرة' },
      { id: 'schopenhauer', name: 'موقف شوبنهاور', description: 'الهوية الشخصية قائمة على الإرادة والطبع الثابت' },
      { id: 'freud', name: 'موقف فرويد', description: 'الأنا بنية وسيطة محاصرة بين الهو والأنا الأعلى والواقع' },
      { id: 'consciousness', name: 'مفهوم الوعي والذاكرة', description: 'دور الوعي في استمرارية الهوية الشخصية' },
      { id: 'will', name: 'مفهوم الإرادة', description: 'الإرادة كنواة ثابتة للوجود عند شوبنهاور' },
      { id: 'psychic-structure', name: 'البنية النفسية الثلاثية', description: 'الهو، الأنا، الأنا الأعلى عند فرويد' },
    ],
    items: [
      {
        conceptId: 'locke', type: 'recall',
        question: 'ما الذي يجعل الشخص «هو هو» عبر الزمن عند جون لوك؟',
        expectedPoints: ['الوعي', 'الذاكرة/امتداد الوعي نحو الماضي'],
      },
      {
        conceptId: 'schopenhauer', type: 'recall',
        question: 'على ماذا تتوقف هوية الشخص عند شوبنهاور؟',
        expectedPoints: ['الإرادة', 'الطبع الثابت'],
      },
      {
        conceptId: 'freud', type: 'recall',
        question: 'ما الأقسام الثلاثة التي يتكون منها الجهاز النفسي عند فرويد؟',
        expectedPoints: ['الهو', 'الأنا', 'الأنا الأعلى'],
      },
      {
        conceptId: 'locke', type: 'comparison',
        question: 'ما الفرق بين أساس الهوية الشخصية عند لوك وشوبنهاور؟',
        expectedPoints: ['لوك: الوعي/الذاكرة', 'شوبنهاور: الإرادة/الطبع الثابت'],
      },
      {
        conceptId: 'consciousness', type: 'error_detection',
        question: 'يقول أحد التلاميذ: «يرى شوبنهاور أن الذاكرة هي أساس الهوية الشخصية». ما الخطأ في هذا القول؟',
        expectedPoints: ['شوبنهاور يرفض الذاكرة أساسًا للهوية', 'فقدان الذاكرة لا يلغي هوية الشخص عنده', 'الأساس عنده هو الإرادة والطبع الثابت'],
      },
      {
        conceptId: 'psychic-structure', type: 'explain',
        question: 'اشرح في سطرين ما يقصده فرويد بقوله إن الأنا «يخدم ثلاثة من السادة الأشداء». من هم؟ وما النتيجة؟',
        expectedPoints: ['السادة الثلاثة: الهو، الأنا الأعلى، العالم الخارجي', 'التوفيق بين مطالبهم مهمة صعبة تفشل غالبًا', 'النتيجة: القلق'],
      },
      {
        conceptId: 'locke', type: 'application',
        question: 'تخيل شخصًا فقد ذاكرته كليًا إثر حادث. كيف يحلل لوك هذه الحالة من حيث الهوية الشخصية؟ وكيف يعارضه شوبنهاور؟',
        expectedPoints: ['عند لوك: فقدان الذاكرة يعني انقطاع الهوية الشخصية السابقة', 'عند شوبنهاور: فقدان الذاكرة لا يلغي الهوية لأن أساسها الإرادة'],
      },
    ],
  },

  'person-value': {
    concepts: [
      { id: 'kant', name: 'موقف كانط', description: 'الشخص غاية في ذاته وقيمته مطلقة لأنه كائن عاقل' },
      { id: 'gusdorf', name: 'موقف غوسدورف', description: 'استقلالية الشخص تتحقق بالمشاركة والانفتاح على الغير' },
      { id: 'dignity', name: 'مفهوم الكرامة', description: 'قيمة الشخص المطلقة غير القابلة للاستبدال' },
      { id: 'autonomy', name: 'مفهوم الاستقلالية', description: 'الاستقلالية بين العزلة الوهمية والمشاركة المتحققة' },
    ],
    items: [
      {
        conceptId: 'kant', type: 'recall',
        question: 'ما أساس القيمة المطلقة للشخص عند كانط؟',
        expectedPoints: ['الطبيعة العاقلة', 'الشخص غاية في ذاته'],
      },
      {
        conceptId: 'gusdorf', type: 'recall',
        question: 'كيف تتحقق استقلالية الشخص الأخلاقي عند غوسدورف؟',
        expectedPoints: ['بالمشاركة', 'بالانفتاح على الغير لا بالعزلة'],
      },
      {
        conceptId: 'kant', type: 'comparison',
        question: 'ما الفرق بين «الأشياء» و«الأشخاص» في تمييز كانط؟',
        expectedPoints: ['الأشياء: قيمة نسبية/مشروطة، قيمة الوسائل', 'الأشخاص: غايات في ذاتها لا تُستعمل كوسيلة محضة'],
      },
      {
        conceptId: 'dignity', type: 'error_detection',
        question: 'يقول أحد التلاميذ: «يرى كانط أن قيمة الشخص تتحدد بحسب حاجتنا إليه ومنفعته لنا». ما الخطأ في هذا القول؟',
        expectedPoints: ['القيمة المشروطة بالرغبة والحاجة هي قيمة الأشياء لا الأشخاص', 'قيمة الشخص مطلقة تنبع من طبيعته العاقلة'],
      },
      {
        conceptId: 'gusdorf', type: 'explain',
        question: 'اشرح ما يقصده غوسدورف بنقد «الفرد الذي يعتقد أنه إمبراطور داخل إمبراطورية».',
        expectedPoints: ['الفرد يتصور نفسه بداية مطلقة في تعارض مع الآخرين', 'هذا استكفاء وهمي', 'الشخص الأخلاقي لا يوجد إلا بالمشاركة'],
      },
      {
        conceptId: 'kant', type: 'application',
        question: 'إعلان تجاري يستعمل جسد المرأة أداةً لجذب الانتباه وتعظيم الربح. حلل هذه الحالة على ضوء مبدأ كانط.',
        expectedPoints: ['معاملة الشخص كوسيلة محضة', 'انتهاك الكرامة/الغاية في ذاتها'],
      },
      {
        conceptId: 'gusdorf', type: 'application',
        question: 'شاب يزعم «الاستقلال التام» عن أسرته ومجتمعه ويرفض كل مساعدة. كيف يقيّم غوسدورف هذا الموقف؟',
        expectedPoints: ['استكفاء وهمي/وهم إيديولوجي', 'اللغة والفكر والقيم نتاج علاقات بشرية سابقة', 'الاستقلالية الحقة تتحقق بالمشاركة'],
      },
    ],
  },

  'necessity-freedom': {
    concepts: [
      { id: 'sartre', name: 'موقف سارتر', description: 'الإنسان مشروع يتجاوز وضعيته بالفعل والممارسة' },
      { id: 'mounier', name: 'موقف مونييه', description: 'الحرية حرية شخص متجسد تستلزم شروطًا واقعية' },
      { id: 'project', name: 'مفهوم المشروع', description: 'البنية الوجودية التي يُعرَّف بها الإنسان عند سارتر' },
      { id: 'conditions', name: 'شروط الحرية', description: 'الشروط البيولوجية والاقتصادية والاجتماعية والسياسية للحرية عند مونييه' },
    ],
    items: [
      {
        conceptId: 'sartre', type: 'recall',
        question: 'بماذا يُعرَّف الإنسان عند سارتر؟ وما الذي يميز المشروع عن الإرادة والحاجة؟',
        expectedPoints: ['الإنسان مشروع', 'يتجاوز وضعيته بالتعالي عليها بالعمل والفعل', 'المشروع ليس إرادة مجردة ولا حاجة ولا هوى'],
      },
      {
        conceptId: 'mounier', type: 'recall',
        question: 'ما الشروط التي يرى مونييه أنها يجب أن تُؤمَّن قبل إعلان الحرية في الدساتير؟',
        expectedPoints: ['الشروط البيولوجية', 'الاقتصادية', 'الاجتماعية', 'السياسية'],
      },
      {
        conceptId: 'sartre', type: 'comparison',
        question: 'قارن بين تصور سارتر وتصور مونييه للحرية من حيث طبيعتها.',
        expectedPoints: ['سارتر: الحرية بنية وجودية، اقتلاع دائم للذات خارج ذاتها', 'مونييه: حرية شخص متجسد ملازمة للوضع الواقعي ومحصورة في حدوده'],
      },
      {
        conceptId: 'mounier', type: 'error_detection',
        question: 'يقول أحد التلاميذ: «يرى مونييه أن مجرد إعلان الحرية في الدساتير كافٍ ليجعل الإنسان حرًا». ما الخطأ في هذا القول؟',
        expectedPoints: ['مونييه يرفض الاكتفاء بالإعلان الخطابي', 'الحرية تستلزم تأمين شروطها الواقعية أولًا'],
      },
      {
        conceptId: 'project', type: 'explain',
        question: 'اشرح قول مونييه: «الحرية كالجسم، لا تتقدم إلا بالحواجز والاختيار والتضحية».',
        expectedPoints: ['الحدود ليست نقيض الحرية بل شرط تدرجها', 'الحرية تنمو بالمقاومة كما تتقوى العضلات بالحواجز'],
      },
      {
        conceptId: 'sartre', type: 'application',
        question: 'شاب نشأ في حي فقير وحُكم عليه مسبقًا بأن مصيره محتوم. كيف يحلل سارتر إمكانية بنائه لمشروع يتجاوز هذه الوضعية؟',
        expectedPoints: ['الوجود الإنساني ليس انعكاسًا للظروف', 'المشروع اقتلاع للوضعية/تعالٍ عليها', 'رفض الحتمية'],
      },
    ],
  },
};

