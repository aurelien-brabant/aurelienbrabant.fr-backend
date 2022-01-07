type PatchData = { [key:string]: any };

type PatchResult = {
    query: string,
    args: any[]
}

const buildPatchQuery = (data: PatchData): PatchResult => {
    const toPatch = Object.keys(data).filter(key => data[key] !== undefined);
    let query = 'SET';
    const args = [];

    for (let i = 0; i < toPatch.length; ++i) {
        if (i > 0) {
            query += ',';
        }
        query += ` ${toPatch[i]} = $${i + 1}`;
        args.push(data[toPatch[i]]);
    }

    return ({ query, args });
}

export default buildPatchQuery;
