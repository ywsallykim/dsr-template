import { CodedEntry } from './srom';

export enum RelationshipType {
    contains = 'CONTAINS',
    hasObservationContext = 'HAS OBS CONTEXT',
    hasConceptModifier = 'HAS CONCEPT MOD',
    hasProperties = 'HAS PROPERTIES',
    hasAcquisitionContext = 'HAS ACQ CONTEXT',
    inferredFrom = 'INFERRED FROM',
    selectedFrom = 'SELECTED FROM',

    refHasProperties = 'R-HAS PROPERTIES',
    refInferredFrom = 'R-INFERRED FROM',
    refSelectedFrom = 'R-SELECTED FROM',
}

export enum ValueType {
    container = 'CONTAINER',
    code = 'CODE',
    image = 'IMAGE',
    text = 'TEXT',
    number = 'NUM',
    include = 'INCLUDE',
    composite = 'COMPOSITE',
    spatialCoord = 'SCOORD',
    temporalCoord = 'TCOORD',
    spatialCoord3d = 'SCOORD3D',
    waveform = 'WAVEFORM',
    personName = 'PNAME',
    uidref = 'UIDREF',
    date = 'DATE',
    time = 'TIME',
    datetime = 'DATETIME',
}

export enum RequirementType {
    mandatory = 'M',
    userOption = 'U',
    mandatoryConditional = 'MC',
    userOptionConditional = 'UC',
    conditional = 'C',
}

interface DataClass<D> {
    serialize(): D;
}

export interface ParameterType {}
export interface CodedConceptConstraint {
    getShortString(): string;
    getFullString(): string;
    isSingleValue(): this is SingleCodedEntry;
}

export interface SingleCodedEntry extends CodedConceptConstraint, ParameterType {
    code: CodedEntry;
}

export class CodedEntryParameter implements SingleCodedEntry {
    constructor(
        public code: CodedEntry,
    ) {}

    getFullString(): string {
        const csv = this.code.getCodingSchemeVersion() ? ` [${this.code.getCodingSchemeVersion()}]` : '';
        return `(${this.code.getCodeValue()}, ${this.code.getCodingSchemeDesignator()}${csv}, "${this.code.getCodeMeaning()}")`;
    }

    getShortString(): string {
        return this.code.getCodeMeaning();
    }

    isSingleValue(): boolean {
        return true;
    }
}

export class EnumeratedValue implements SingleCodedEntry {
    constructor(
        public code: CodedEntry,
    ) {}

    getFullString(): string {
        const csv = this.code.getCodingSchemeVersion() ? ` [${this.code.getCodingSchemeVersion()}]` : '';
        return `EV (${this.code.getCodeValue()}, ${this.code.getCodingSchemeDesignator()}${csv}, "${this.code.getCodeMeaning()}")`;
    }

    getShortString(): string {
        return this.code.getCodeMeaning();
    }

    isSingleValue(): boolean {
        return true;
    }
}
export class DefinedTerm implements SingleCodedEntry {
    constructor(
        public code: CodedEntry,
    ) {}

    getFullString(): string {
        const csv = this.code.getCodingSchemeVersion() ? ` [${this.code.getCodingSchemeVersion()}]` : '';
        return `DT (${this.code.getCodeValue()}, ${this.code.getCodingSchemeDesignator()}${csv}, "${this.code.getCodeMeaning()}")`;
    }

    getShortString(): string {
        return this.code.getCodeMeaning();
    }

    isSingleValue(): boolean {
        return true;
    }
}

export interface ContextGroup extends CodedConceptConstraint {
    cid: number;
    name?: string;
}
export class BaselineCID implements ContextGroup {
    constructor(
        public cid: number,
        public name?: string,
    ) {}

    getFullString(): string {
        const name = this.name ? ` ${this.name}` : '';
        return `BCID ${this.cid}${name}`;
    }

    getShortString(): string {
        return this.name || `BCID ${this.cid}`;
    }

    isSingleValue(): boolean {
        return false;
    }
}
export class DefinedCID implements ContextGroup {
    constructor(
        public cid: number,
        public name?: string,
    ) {}

    getFullString(): string {
        const name = this.name ? ` ${this.name}` : '';
        return `DCID ${this.cid}${name}`;
    }

    getShortString(): string {
        return this.name || `DCID ${this.cid}`;
    }

    isSingleValue(): boolean {
        return false;
    }
}

export interface TemplateReference extends CodedConceptConstraint {
    tid: number;
    name?: string;
}
export class BaselineTID implements TemplateReference {
    constructor(
        public tid: number,
        public name?: string,
    ) {}

    getFullString(): string {
        const name = this.name ? ` ${this.name}` : '';
        return `BTID ${this.tid}${name}`;
    }

    getShortString(): string {
        return this.name || `BTID ${this.tid}`
    }

    isSingleValue(): boolean {
        return true;
    }
}
export class DefinedTID implements TemplateReference {
    constructor(
        public tid: number,
        public name: string | undefined,
    ) {}

    getFullString(): string {
        const name = this.name ? ` ${this.name}` : '';
        return `DTID ${this.tid}${name}`;
    }

    getShortString(): string {
        return this.name || `DTID ${this.tid}`
    }

    isSingleValue(): boolean {
        return true;
    }
}

export interface ISrRow {
    relationshipType?: RelationshipType,
    valueType: ValueType,
    concept?: CodedConceptConstraint;
    valueMultiplicity: [number, number];
    requirementType: RequirementType;
    valueSetConstraint?: ContextGroup;
}
export class SrRow implements ISrRow {
    constructor(
        public relationshipType: RelationshipType | undefined,
        public valueType: ValueType,
        public concept: CodedConceptConstraint | undefined,
        public valueMultiplicity: [number, number],
        public requirementType: RequirementType,
        public children: SrRow[],
        public valueSetConstraint?: ContextGroup,
    ) {}

    setConcept(concept?: CodedConceptConstraint): SrRow {
        return new SrRow(
            this.relationshipType,
            this.valueType,
            concept,
            this.valueMultiplicity,
            this.requirementType,
            this.children,
            this.valueSetConstraint,
        );
    }
}

export interface ISrTemplate {
    tid: number;
    name: string;
    extensible: boolean;
    isRoot: boolean;
    orderSignificant: boolean;
    rows: SrRow[];
}
export class SrTemplate {
    constructor(
        public tid: number,
        public name: string,
        public extensible: boolean,
        public isRoot: boolean,
        public orderSignificant: boolean,
        public rows: SrRow[],
    ) {
    }

    traverse(path: string): SrRow {
        let rows = this.rows;
        let result = null;
        for (const idx of path.split('.')) {
            result = rows[parseInt(idx) - 1];
            rows = result.children;
        }
        if (result === null) {
            throw new Error(`Cannot find ${path}`);
        }
        return result;
    }

    addChildRowAt(path: string, row: SrRow) {
        const target = this.traverse(path);
        target.children.push(row);
    }
}

export const measurementReport = new SrTemplate(
    1500,
    'Measurement Report',
    true,
    true,
    false,
    [
        new SrRow(
            undefined,
            ValueType.container,
            new DefinedCID(7021, 'Measurement Report Document Titles'),
            [1, 1],
            RequirementType.mandatory,
            [
                new SrRow(
                    RelationshipType.hasConceptModifier,
                    ValueType.include,
                    new DefinedTID(1204, 'Language of Content Item and Descendants'),
                    [1, 1],
                    RequirementType.mandatory,
                    [],
                ),
                new SrRow(
                    RelationshipType.hasObservationContext,
                    ValueType.include,
                    new DefinedTID(1001, 'Observation Context'),
                    [1, 1],
                    RequirementType.mandatory,
                    [],
                ),
                new SrRow(
                    RelationshipType.hasConceptModifier,
                    ValueType.code,
                    new EnumeratedValue(new CodedEntry('121058', 'DCM', 'Procedure reported')),
                    [1, Infinity],
                    RequirementType.mandatory,
                    [],
                    new BaselineCID(100, "Quantative Diagnosis Imaging Procedures"),
                ),
                new SrRow(
                    RelationshipType.contains,
                    ValueType.include,
                    new DefinedTID(1600, 'Image Library'),
                    [1, 1],
                    RequirementType.mandatory,
                    [],
                ),
                new SrRow(
                    RelationshipType.contains,
                    ValueType.container,
                    new EnumeratedValue(new CodedEntry('126010', 'DCM', 'Imaging Measurements')),
                    [1, 1],
                    RequirementType.conditional,
                    [
                        new SrRow(
                            RelationshipType.hasConceptModifier,
                            ValueType.include,
                            new DefinedTID(4019, 'Algorithm Identification'),
                            [1, 1],
                            RequirementType.userOption,
                            [],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.include,
                            new DefinedTID(1401, 'Planar ROI Measurements and Qualitative Evaluations'),
                            [1, Infinity],
                            RequirementType.userOption,
                            [],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.include,
                            new DefinedTID(1411, 'Volumetric ROI Measurements and Qualitative Evaluations'),
                            [1, Infinity],
                            RequirementType.userOption,
                            [],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.include,
                            new DefinedTID(1501, 'Measurement and Qualitative Evaluation Group'),
                            [1, Infinity],
                            RequirementType.userOption,
                            [],
                        ),
                    ],
                ),
                new SrRow(
                    RelationshipType.contains,
                    ValueType.container,
                    new EnumeratedValue(new CodedEntry('126011', 'DCM', 'Derived Imaging Measurements')),
                    [1, 1],
                    RequirementType.conditional,
                    [
                        new SrRow(
                            RelationshipType.hasConceptModifier,
                            ValueType.include,
                            new DefinedTID(4019, 'Algorithm Identification'),
                            [1, 1],
                            RequirementType.userOption,
                            [],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.include,
                            new DefinedTID(1420, 'Measurements Derived From Multiple ROI Measurements'),
                            [1, Infinity],
                            RequirementType.userOption,
                            [],
                        ),
                    ],
                ),
                new SrRow(
                    RelationshipType.contains,
                    ValueType.container,
                    new EnumeratedValue(new CodedEntry('C0034375', 'UMLS', 'Qualitative Evaluations')),
                    [1, 1],
                    RequirementType.conditional,
                    [
                        new SrRow(
                            RelationshipType.hasConceptModifier,
                            ValueType.include,
                            new DefinedTID(4019, 'Algorithm Identification'),
                            [1, 1],
                            RequirementType.userOption,
                            [],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.code,
                            undefined,
                            [1, Infinity],
                            RequirementType.userOption,
                            [
                                new SrRow(
                                    RelationshipType.hasConceptModifier,
                                    ValueType.code,
                                    new BaselineCID(210, 'Qualitative Evaluation Modifier Types'),
                                    [1, Infinity],
                                    RequirementType.userOption,
                                    [],
                                    new BaselineCID(211, 'Qualitative Evaluation Modifier Values')
                                ),
                            ],
                        ),
                        new SrRow(
                            RelationshipType.contains,
                            ValueType.text,
                            undefined,
                            [1, Infinity],
                            RequirementType.userOption,
                            [],
                        ),
                    ],
                ),
            ],
        )
    ]
);
