from flask import jsonify

def success_response(message, data=None, status_code=200):
    """Create a standardized success response"""
    response = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code

def error_response(message, status_code=400, error_code=None):
    """Create a standardized error response"""
    response = {
        'success': False,
        'message': message
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return jsonify(response), status_code

def paginated_response(items, page, per_page, total, message="Data retrieved successfully"):
    """Create a standardized paginated response"""
    response = {
        'success': True,
        'message': message,
        'data': {
            'items': items,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
                'has_prev': page > 1,
                'has_next': page < (total + per_page - 1) // per_page
            }
        }
    }
    
    return jsonify(response), 200
